import { ENUMS, normalizeArWhatsapp } from '@huellitas/shared';
import * as PrismaEnums from './generated/prisma/enums.js';

describe('@huellitas/shared', () => {
  it.each(Object.entries(ENUMS))('el enum %s coincide con Prisma', (name, values) => {
    const prismaEnum = (PrismaEnums as Record<string, Record<string, string>>)[name];
    expect(prismaEnum).toBeDefined();
    expect(Object.values(values).sort()).toEqual(Object.values(prismaEnum ?? {}).sort());
  });

  it.each([
    ['353 4123456', '+5493534123456'],
    ['0353-15-4123456', '+5493534123456'],
    ['+54 9 353 412-3456', '+5493534123456'],
    ['5493534123456', '+5493534123456'],
    ['011 15 2345 6789', '+5491123456789'],
  ])('normaliza WhatsApp %s', (raw, expected) => {
    expect(normalizeArWhatsapp(raw)).toBe(expected);
  });

  it.each(['123', 'hola', '353412345678901'])('rechaza WhatsApp inválido %s', (raw) => {
    expect(normalizeArWhatsapp(raw)).toBeNull();
  });
});
