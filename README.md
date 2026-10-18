# Huellita Leones

App solidaria de mascotas perdidas, encontradas y en adopción. Un proyecto de MAB DEV.

| Paquete           | Qué es                                                             |
| ----------------- | ------------------------------------------------------------------ |
| `apps/api`        | NestJS 12 + Prisma 7 + PostgreSQL (puerto 3100, prefijo `/api/v1`) |
| `apps/mobile`     | Expo SDK 58 + Expo Router + NativeWind + TanStack Query + Zustand  |
| `apps/web`        | Next.js 16 + Tailwind 4 + shadcn/ui (puerto 3101)                  |
| `packages/shared` | Schemas Zod, enums y tipos compartidos                             |
| `packages/config` | tsconfig base                                                      |

## Requisitos

- Node 24 y pnpm 12 (`corepack enable`)
- PostgreSQL 18, nativo o con Docker (`docker compose -f docker/compose.dev.yml up -d`)
- Android: celular con un _development build_ (Google Sign-In no funciona en Expo Go)

## Setup

```bash
# 1. Base de datos: Postgres propio del proyecto, sin sudo (puerto 5433)
#    Inicialización (una sola vez):
/usr/lib/postgresql/18/bin/initdb -D ~/.local/share/huellitas-pg/data -U huellitas \
  --auth=scram-sha-256 --pwfile=<(echo huellitas) -E UTF8 --locale=C.UTF-8
scripts/db.sh start          # después de cada reinicio de la máquina (stop | status)
PGPASSWORD=huellitas createdb -h localhost -p 5433 -U huellitas huellitas
PGPASSWORD=huellitas createdb -h localhost -p 5433 -U huellitas huellitas_test

# 2. Dependencias y variables
pnpm install
cp apps/api/.env.example apps/api/.env      # completar JWT_ACCESS_SECRET (openssl rand -base64 48)
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Migraciones + seed (Leones, barrios y admin si SEED_ADMIN_* está cargado)
pnpm --filter @huellitas/api db:migrate
pnpm --filter @huellitas/api db:seed
```

## Desarrollo

```bash
pnpm dev                              # todo junto con Turborepo
pnpm --filter @huellitas/api dev      # solo la API
pnpm --filter @huellitas/web dev      # solo la web
pnpm --filter @huellitas/mobile dev   # Metro
```

La app usa la IP de la máquina que corre Metro para encontrar la API, así que con el celu en la misma red WiFi no hay que configurar nada.

## Calidad

```bash
pnpm typecheck
pnpm lint
pnpm test                                   # unitarios
pnpm --filter @huellitas/api test:e2e       # e2e contra huellitas_test (se resetea)
```

## Google Sign-In

1. En Google Cloud Console crear credenciales OAuth: **Web**, **Android** (package `com.mabdev.huellitaleones` + SHA-1 del keystore de debug/EAS) y, más adelante, **iOS**.
2. API: `GOOGLE_CLIENT_IDS=<web>,<android>` en `apps/api/.env`.
3. Mobile: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web>` en `apps/mobile/.env`.
4. Generar el development build: `pnpm --filter @huellitas/mobile android` (o `eas build --profile development`).

## Marca

Dirección "Melena": huella dentro de la melena de un león. Naranja `#E8590C`, melena `#F2A516`, tinta `#2B1A12`, crema `#FFF8EE`; botones `#B8400C`. Tipografías Baloo 2 (títulos) y Nunito Sans (texto).

- SVG maestros en `assets/brand/`. Íconos, splash y favicons salen de `scripts/brand-assets.mjs`: si cambia el logo, se edita ahí y se corre `pnpm brand:assets`.
- Tokens: `apps/web/src/app/globals.css` (shadcn) y `apps/mobile/tailwind.config.js` + `apps/mobile/src/theme.ts`.
