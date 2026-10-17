export const DEFAULT_CITY_SLUG = 'leones-cba';

export const LIMITS = {
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 72, // límite práctico de bcrypt/argon2 en bytes
  NAME_MAX: 80,
  PHOTOS_PER_PET: 5,
  PHOTOS_PER_POST: 5,
  DESCRIPTION_MAX: 2000,
  FEED_PAGE_SIZE: 20,
  FEED_PAGE_SIZE_MAX: 50,
} as const;

/** Código de país + área para normalizar WhatsApp argentino (E.164 móvil: +549...) */
export const AR_MOBILE_PREFIX = '+549';
