import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import type { Env } from './config/env.js';

/** Config compartida entre main.ts y los tests e2e */
export function setupApp(app: INestApplication, env: Env): void {
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : env.NODE_ENV !== 'production',
  });
  if (env.NODE_ENV === 'production') {
    // Detrás de Caddy: para que el rate limit vea la IP real
    (app as NestExpressApplication).set('trust proxy', 1);
  }
  app.enableShutdownHooks();
}
