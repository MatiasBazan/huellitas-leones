import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { MediaResponse, PresignMediaInput, PresignMediaResponse } from '@huellitas/shared';
import type { AuthUser } from '../../common/auth.decorators.js';
import type { Media, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

export type PhotoTarget = { petId: string } | { postId: string };

const EXTENSIONS: Record<PresignMediaInput['contentType'], string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/** Una PENDING que no se confirmó en este tiempo se considera abandonada */
const PENDING_TTL_MS = 60 * 60 * 1000;
/** Una READY que nunca se asignó a nada (el usuario abandonó el formulario) */
const UNATTACHED_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async presign(user: AuthUser, input: PresignMediaInput): Promise<PresignMediaResponse> {
    const key = `cities/${user.cityId}/${randomUUID()}.${EXTENSIONS[input.contentType]}`;
    const media = await this.prisma.media.create({
      data: {
        key,
        mimeType: input.contentType,
        sizeBytes: input.sizeBytes,
        width: input.width ?? null,
        height: input.height ?? null,
        uploaderId: user.id,
      },
    });
    const target = await this.storage.createUploadTarget(key, input.contentType, input.sizeBytes);
    return { mediaId: media.id, uploadUrl: target.url, uploadHeaders: target.headers };
  }

  /** Chequea que el archivo haya llegado al bucket y lo deja usable. Idempotente. */
  async confirm(userId: string, mediaId: string): Promise<MediaResponse> {
    const media = await this.findOwned(userId, mediaId);
    if (media.status === 'READY') return this.toResponse(media);

    const stored = await this.storage.stat(media.key);
    if (!stored) throw new BadRequestException('La foto todavía no terminó de subirse');
    if (stored.sizeBytes !== media.sizeBytes) {
      await this.storage.delete([media.key]);
      await this.prisma.media.delete({ where: { id: media.id } });
      throw new BadRequestException('La foto llegó incompleta, probá de nuevo');
    }

    const ready = await this.prisma.media.update({
      where: { id: media.id },
      data: { status: 'READY' },
    });
    return this.toResponse(ready);
  }

  /** Solo fotos sueltas; las de una mascota se sacan editando la mascota */
  async remove(userId: string, mediaId: string): Promise<void> {
    const media = await this.findOwned(userId, mediaId);
    if (media.petId || media.postId || (await this.isAvatar(media.id))) {
      throw new ConflictException('La foto está en uso: sacala desde la mascota o la publicación');
    }
    await this.prisma.media.delete({ where: { id: media.id } });
    await this.storage.delete([media.key]);
  }

  /**
   * Deja en la mascota o publicación exactamente `mediaIds`, en ese orden. Devuelve los keys
   * de las fotos que salieron, para borrarlas del bucket después de que confirme la transacción.
   */
  async setPhotos(
    tx: Prisma.TransactionClient,
    userId: string,
    target: PhotoTarget,
    mediaIds: string[],
  ): Promise<string[]> {
    const owner = 'petId' in target ? { petId: target.petId } : { postId: target.postId };
    if (mediaIds.length) {
      const usable = await tx.media.findMany({
        where: {
          id: { in: mediaIds },
          uploaderId: userId,
          status: 'READY',
          avatarOf: null,
          OR: [{ petId: null, postId: null }, owner],
        },
        select: { id: true },
      });
      if (usable.length !== mediaIds.length) {
        throw new BadRequestException('Alguna de las fotos no existe o no terminó de subirse');
      }
    }

    const removed = await tx.media.findMany({
      where: { ...owner, id: { notIn: mediaIds } },
      select: { id: true, key: true },
    });
    if (removed.length) {
      await tx.media.deleteMany({ where: { id: { in: removed.map((m) => m.id) } } });
    }
    await Promise.all(
      mediaIds.map((id, position) =>
        tx.media.update({ where: { id }, data: { ...owner, position } }),
      ),
    );
    return removed.map((m) => m.key);
  }

  /** Una foto confirmada, del usuario y sin usar: para avatar */
  async assertFree(userId: string, mediaId: string): Promise<void> {
    const media = await this.prisma.media.findFirst({
      where: {
        id: mediaId,
        uploaderId: userId,
        status: 'READY',
        petId: null,
        postId: null,
        avatarOf: null,
      },
      select: { id: true },
    });
    if (!media) throw new BadRequestException('La foto no existe o no terminó de subirse');
  }

  /** Borra del bucket sin cortar el request si falla: lo que quede lo levanta la limpieza */
  async deleteObjectsQuietly(keys: string[]): Promise<void> {
    try {
      await this.storage.delete(keys);
    } catch (err) {
      this.logger.warn(`No se pudieron borrar ${keys.length} objetos: ${String(err)}`);
    }
  }

  toResponse(media: Pick<Media, 'id' | 'key' | 'width' | 'height'>): MediaResponse {
    return {
      id: media.id,
      url: this.storage.publicUrl(media.key),
      width: media.width,
      height: media.height,
    };
  }

  @Cron(CronExpression.EVERY_HOUR, { name: 'media-cleanup' })
  async cleanupOrphans(now = new Date()): Promise<number> {
    const orphans = await this.prisma.media.findMany({
      where: {
        petId: null,
        postId: null,
        avatarOf: null,
        OR: [
          { status: 'PENDING', createdAt: { lt: new Date(now.getTime() - PENDING_TTL_MS) } },
          { status: 'READY', createdAt: { lt: new Date(now.getTime() - UNATTACHED_TTL_MS) } },
        ],
      },
      select: { id: true, key: true },
      take: 500,
    });
    if (!orphans.length) return 0;

    await this.storage.delete(orphans.map((m) => m.key));
    await this.prisma.media.deleteMany({ where: { id: { in: orphans.map((m) => m.id) } } });
    this.logger.log(`Limpieza: ${orphans.length} fotos huérfanas borradas`);
    return orphans.length;
  }

  private async isAvatar(mediaId: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { avatarMediaId: mediaId } })) > 0;
  }

  private async findOwned(userId: string, mediaId: string): Promise<Media> {
    const media = await this.prisma.media.findFirst({ where: { id: mediaId, uploaderId: userId } });
    if (!media) throw new NotFoundException('Foto no encontrada');
    return media;
  }
}
