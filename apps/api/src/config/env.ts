import { z } from 'zod';
import { DEFAULT_CITY_SLUG } from '@huellitas/shared';

const csv = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3100),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  /** Client IDs de Google aceptados como audience (web, android, ios), separados por coma */
  GOOGLE_CLIENT_IDS: csv,
  CORS_ORIGINS: csv,
  DEFAULT_CITY_SLUG: z.string().default(DEFAULT_CITY_SLUG),
  /** URL pública de la web: links compartidos y mensaje de WhatsApp */
  PUBLIC_WEB_URL: z.url().default('http://localhost:3101'),
  /** local = disco de la máquina (desarrollo); r2 = Cloudflare R2 */
  STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  /** Dominio público del bucket (custom domain o r2.dev), sin barra final */
  R2_PUBLIC_BASE_URL: z.url().optional(),
});

const r2Keys = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
] as const;

const envWithStorageSchema = envSchema.superRefine((env, ctx) => {
  if (env.STORAGE_DRIVER !== 'r2') return;
  for (const key of r2Keys) {
    if (!env[key])
      ctx.addIssue({ code: 'custom', path: [key], message: 'Requerida con STORAGE_DRIVER=r2' });
  }
});

export type Env = z.infer<typeof envSchema>;

export const ENV = Symbol('ENV');

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envWithStorageSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
