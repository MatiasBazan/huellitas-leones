import { z } from 'zod';
import { AR_MOBILE_PREFIX, LIMITS } from '../constants.js';

/**
 * Acepta formatos comunes argentinos ("353 4123456", "0353-15-4123456", "+54 9 353...")
 * y los normaliza a E.164 móvil (+549XXXXXXXXXX, 10 dígitos nacionales).
 */
export function normalizeArWhatsapp(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('54')) digits = digits.slice(2);
  if (digits.startsWith('9')) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = digits.slice(1);
  // Saca el "15" después del código de área (área de 2 a 4 dígitos)
  if (digits.length === 12) {
    for (const areaLen of [2, 3, 4]) {
      if (digits.slice(areaLen, areaLen + 2) === '15') {
        digits = digits.slice(0, areaLen) + digits.slice(areaLen + 2);
        break;
      }
    }
  }
  return digits.length === 10 ? `${AR_MOBILE_PREFIX}${digits}` : null;
}

export const whatsappSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const normalized = normalizeArWhatsapp(v);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'Número de WhatsApp inválido' });
      return z.NEVER;
    }
    return normalized;
  });

export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(LIMITS.NAME_MAX),
    avatarUrl: z.url().nullable(),
    neighborhoodId: z.uuid().nullable(),
    whatsapp: whatsappSchema.nullable(),
    notifyLostPets: z.boolean(),
  })
  .partial();
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export type CityResponse = { id: string; slug: string; name: string; province: string };
export type NeighborhoodResponse = { id: string; name: string };
