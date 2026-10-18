import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { MeResponse, UpdateMeInput } from '@huellitas/shared';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MediaService } from '../media/media.service.js';

const meInclude = {
  city: { select: { id: true, slug: true, name: true } },
  neighborhood: { select: { id: true, name: true } },
  avatarMedia: { select: { id: true, key: true, width: true, height: true } },
} satisfies Prisma.UserInclude;

type UserWithRelations = Prisma.UserGetPayload<{ include: typeof meInclude }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: meInclude });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.toMe(user);
  }

  async updateMe(userId: string, input: UpdateMeInput): Promise<MeResponse> {
    if (input.neighborhoodId) {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { cityId: true },
      });
      const neighborhood = await this.prisma.neighborhood.findFirst({
        where: { id: input.neighborhoodId, cityId: user.cityId },
        select: { id: true },
      });
      if (!neighborhood) throw new BadRequestException('El barrio no pertenece a tu ciudad');
    }

    const { avatarMediaId, ...fields } = input;
    let previousAvatar: { id: string; key: string } | null = null;
    if (avatarMediaId !== undefined) {
      if (avatarMediaId) await this.media.assertFree(userId, avatarMediaId);
      const current = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { avatarMedia: { select: { id: true, key: true } } },
      });
      if (current.avatarMedia?.id !== avatarMediaId) previousAvatar = current.avatarMedia;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { ...fields, ...(avatarMediaId !== undefined && { avatarMediaId }) },
      include: meInclude,
    });
    // La foto vieja ya no la usa nadie: se borra (la FK quedó en null al reemplazarla)
    if (previousAvatar) {
      await this.prisma.media.delete({ where: { id: previousAvatar.id } });
      await this.media.deleteObjectsQuietly([previousAvatar.key]);
    }
    return this.toMe(updated);
  }

  toMe(user: UserWithRelations): MeResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: this.avatarUrl(user),
      whatsapp: user.whatsapp,
      role: user.role,
      status: user.status,
      notifyLostPets: user.notifyLostPets,
      city: user.city,
      neighborhood: user.neighborhood,
      profileIncomplete: !user.neighborhoodId,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /** La foto subida gana a la de Google */
  avatarUrl(user: {
    avatarUrl: string | null;
    avatarMedia: { id: string; key: string; width: number | null; height: number | null } | null;
  }): string | null {
    return user.avatarMedia ? this.media.toResponse(user.avatarMedia).url : user.avatarUrl;
  }

  findByIdWithRelations(userId: string): Promise<UserWithRelations> {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, include: meInclude });
  }
}
