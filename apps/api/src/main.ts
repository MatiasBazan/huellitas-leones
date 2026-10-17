import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';
import { ENV, type Env } from './config/env.js';

try {
  process.loadEnvFile('.env');
} catch {
  // sin .env: se usan las variables del entorno (Docker/CI)
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const env = app.get<Env>(ENV);
  setupApp(app, env);
  // 0.0.0.0 para que el celular en la misma red llegue a la API en desarrollo
  await app.listen(env.PORT, '0.0.0.0');
  Logger.log(`API escuchando en http://localhost:${env.PORT}/api/v1`, 'Bootstrap');
}
await bootstrap();
