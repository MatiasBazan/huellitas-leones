import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { MEDIA } from '@huellitas/shared';
import { ENV, type Env } from '../../config/env.js';
import { StorageService, type StoredObject, type UploadTarget } from './storage.service.js';

@Injectable()
export class R2StorageService extends StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor(@Inject(ENV) env: Env) {
    super();
    // La validación de env garantiza estas variables con STORAGE_DRIVER=r2
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = env.R2_BUCKET!;
    this.publicBase = env.R2_PUBLIC_BASE_URL!.replace(/\/$/, '');
  }

  async createUploadTarget(
    key: string,
    contentType: string,
    sizeBytes: number,
  ): Promise<UploadTarget> {
    // ContentType y ContentLength quedan firmados: R2 rechaza un archivo distinto al declarado
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: sizeBytes,
      CacheControl: 'public, max-age=31536000, immutable',
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: MEDIA.UPLOAD_URL_TTL_SECONDS,
    });
    return {
      url,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    };
  }

  async stat(key: string): Promise<StoredObject | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { sizeBytes: res.ContentLength ?? 0, contentType: res.ContentType ?? null };
    } catch (err) {
      if (err instanceof NotFound) return null;
      throw err;
    }
  }

  async delete(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }
}
