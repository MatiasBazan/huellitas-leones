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
  PET_NAME_MAX: 40,
  PET_TEXT_MAX: 60,
  PET_MARKS_MAX: 500,
} as const;

export const MEDIA = {
  /** La app comprime antes de subir: lado mayor 1600px en WebP (también le saca el EXIF con GPS) */
  IMAGE_MAX_SIDE: 1600,
  MAX_UPLOAD_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/webp', 'image/jpeg', 'image/png'],
  /** Vida de la URL firmada para subir */
  UPLOAD_URL_TTL_SECONDS: 600,
} as const;

/** Código de país + área para normalizar WhatsApp argentino (E.164 móvil: +549...) */
export const AR_MOBILE_PREFIX = '+549';
