// Seed idempotente: se puede correr varias veces.
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

try {
  process.loadEnvFile('.env');
} catch {
  // variables del entorno
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

// TODO(MAB): completar con la lista real de barrios de Leones
const LEONES_NEIGHBORHOODS = ['Centro'];

async function main() {
  const leones = await prisma.city.upsert({
    where: { slug: 'leones-cba' },
    update: {},
    create: {
      slug: 'leones-cba',
      name: 'Leones',
      province: 'Córdoba',
      lat: -32.6603,
      lng: -62.2967,
    },
  });

  for (const name of LEONES_NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { cityId_name: { cityId: leones.id, name } },
      update: {},
      create: { cityId: leones.id, name },
    });
  }

  const adminEmail = process.env['SEED_ADMIN_EMAIL']?.toLowerCase();
  const adminPassword = process.env['SEED_ADMIN_PASSWORD'];
  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN' },
      create: {
        email: adminEmail,
        name: 'Admin',
        passwordHash: await argon2.hash(adminPassword),
        emailVerifiedAt: new Date(),
        role: 'ADMIN',
        cityId: leones.id,
      },
    });
    console.log(`Admin listo: ${adminEmail}`);
  }

  console.log(`Ciudad: ${leones.name} (${LEONES_NEIGHBORHOODS.length} barrios)`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
