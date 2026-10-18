import { createWriteStream } from 'node:fs';
import { mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Inject, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MEDIA } from '@huellitas/shared';
import { ENV, type Env } from '../../config/env.js';
import { StorageService, type StoredObject, type UploadTarget } from './storage.service.js';

export const LOCAL_FILES_PREFIX = '/media/files';
export const LOCAL_UPLOAD_PREFIX = '/media/local-upload';

type UploadClaims = { typ: 'upload'; key: string; ct: string; size: number };

/**
 * Solo para desarrollo: imita a R2 guardando en disco. La "URL firmada" es un JWT con
 * secreto propio que autoriza un único key, tipo y tamaño. Las URLs son relativas a la API.
 */
@Injectable()
export class LocalStorageService extends StorageService {
  readonly root: string;
  private readonly secret: string;

  constructor(
    @Inject(ENV) env: Env,
    private readonly jwt: JwtService,
  ) {
    super();
    this.root = resolve(env.STORAGE_LOCAL_DIR);
    this.secret = `${env.JWT_ACCESS_SECRET}:local-upload`;
  }

  async createUploadTarget(
    key: string,
    contentType: string,
    sizeBytes: number,
  ): Promise<UploadTarget> {
    const claims: UploadClaims = { typ: 'upload', key, ct: contentType, size: sizeBytes };
    const token = await this.jwt.signAsync(claims, {
      secret: this.secret,
      expiresIn: MEDIA.UPLOAD_URL_TTL_SECONDS,
    });
    return { url: `${LOCAL_UPLOAD_PREFIX}/${token}`, headers: { 'Content-Type': contentType } };
  }

  /** Verifica el token y guarda el cuerpo del PUT; null si el token no sirve */
  async acceptUpload(
    token: string,
    contentType: string | undefined,
    body: Readable,
  ): Promise<boolean> {
    let claims: UploadClaims;
    try {
      claims = await this.jwt.verifyAsync<UploadClaims>(token, { secret: this.secret });
    } catch {
      return false;
    }
    if (claims.typ !== 'upload' || claims.ct !== contentType) return false;

    const file = this.pathFor(claims.key);
    await mkdir(dirname(file), { recursive: true });
    let received = 0;
    body.on('data', (chunk: Buffer) => {
      received += chunk.length;
      if (received > claims.size)
        body.destroy(new PayloadTooLargeException('El archivo no coincide'));
    });
    try {
      await pipeline(body, createWriteStream(file));
    } catch (err) {
      await rm(file, { force: true });
      throw err;
    }
    if (received !== claims.size) {
      await rm(file, { force: true });
      return false;
    }
    return true;
  }

  async stat(key: string): Promise<StoredObject | null> {
    try {
      const s = await stat(this.pathFor(key));
      return { sizeBytes: s.size, contentType: null };
    } catch {
      return null;
    }
  }

  async delete(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => rm(this.pathFor(key), { force: true })));
  }

  publicUrl(key: string): string {
    return `${LOCAL_FILES_PREFIX}/${key}`;
  }

  private pathFor(key: string): string {
    const file = resolve(this.root, key);
    if (!file.startsWith(this.root + sep)) throw new Error(`Key inválida: ${key}`);
    return file;
  }
}
