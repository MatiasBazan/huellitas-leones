import { execSync } from 'node:child_process';

/** Aplica las migraciones sobre la base de test antes de la corrida */
export default function setup(): void {
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env['TEST_DATABASE_URL'] },
  });
}
