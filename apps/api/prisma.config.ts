import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile('.env');
} catch {
  // sin .env: se usan las variables del entorno (Docker/CI)
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
