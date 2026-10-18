import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

try {
  process.loadEnvFile('.env');
} catch {
  // CI: variables del entorno
}

const testDbUrl = process.env['TEST_DATABASE_URL'];
if (!testDbUrl) throw new Error('Falta TEST_DATABASE_URL para los tests e2e');

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDbUrl,
      GOOGLE_CLIENT_IDS: '',
      STORAGE_DRIVER: 'local',
      STORAGE_LOCAL_DIR: join(tmpdir(), 'huellitas-e2e-storage'),
    },
    fileParallelism: false,
  },
});
