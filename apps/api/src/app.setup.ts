import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'node:path';
import helmet from 'helmet';
import type { Env } from './config/env.js';
import { LOCAL_FILES_PREFIX } from './modules/storage/local-storage.service.js';

/** Config compartida entre main.ts y los tests e2e */
export function setupApp(app: INestApplication, env: Env): void {
  app.setGlobalPrefix('api/v1');
  // cross-origin: la web (otro origen) muestra las fotos servidas por la API en desarrollo
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  if (env.STORAGE_DRIVER === 'local') {
    (app as NestExpressApplication).useStaticAssets(resolve(env.STORAGE_LOCAL_DIR), {
      prefix: `/api/v1${LOCAL_FILES_PREFIX}`,
      immutable: true,
      maxAge: '365d',
    });
  }
  app.enableCors({
    origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : env.NODE_ENV !== 'production',
  });
  if (env.NODE_ENV === 'production') {
    // Detrás de Caddy: para que el rate limit vea la IP real
    (app as NestExpressApplication).set('trust proxy', 1);
  }
  app.enableShutdownHooks();
}
