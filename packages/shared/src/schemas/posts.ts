import { z } from 'zod';
import { LIMITS } from '../constants.js';
import { PetSize, PostStatus, PostType, Resolution, Sex, Species } from '../enums.js';
import type { MediaResponse } from './media.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null));

/** ISO con hora; no futura (5 min de tolerancia por relojes) ni de hace más de un año */
const eventDateSchema = z.iso
  .datetime({ offset: true })
  .refine(
    (d) => new Date(d).getTime() <= Date.now() + 5 * 60 * 1000,
    'La fecha no puede ser futura',
  )
  .refine(
    (d) => new Date(d).getTime() >= Date.now() - LIMITS.EVENT_MAX_DAYS_AGO * DAY_MS,
    'La fecha es demasiado vieja',
  );

const placeFields = {
  neighborhoodId: z.uuid().nullable().default(null),
  zoneText: optionalText(LIMITS.ZONE_MAX).default(null),
};

const descriptionSchema = z
  .string()
  .trim()
  .min(LIMITS.DESCRIPTION_MIN, 'Contá un poco más (mínimo 10 caracteres)')
  .max(LIMITS.DESCRIPTION_MAX);

const mediaIdsSchema = z
  .array(z.uuid())
  .min(1, 'Subí al menos una foto')
  .max(LIMITS.PHOTOS_PER_POST, `Hasta ${LIMITS.PHOTOS_PER_POST} fotos`)
  .refine((ids) => new Set(ids).size === ids.length, 'Fotos repetidas');

/** POST /pets/:id/report-lost: los datos del animal salen del perfil de la mascota */
export const reportLostSchema = z.object({
  ...placeFields,
  eventDate: eventDateSchema,
  description: descriptionSchema,
  showPhone: z.boolean().default(true),
});
export type ReportLostInput = z.input<typeof reportLostSchema>;
export type ReportLostData = z.output<typeof reportLostSchema>;

const animalFields = {
  species: z.enum(Species),
  sex: z.enum(Sex).default(Sex.DESCONOCIDO),
  size: z.enum(PetSize).nullable().default(null),
  color: optionalText(LIMITS.PET_TEXT_MAX).default(null),
};

export const adoptionDetailsSchema = z.object({
  approxAgeMonths: z.number().int().min(0).max(360).nullable().default(null),
  neutered: z.boolean().nullable().default(null),
  vaccinated: z.boolean().nullable().default(null),
  dewormed: z.boolean().nullable().default(null),
  requirements: optionalText(LIMITS.REQUIREMENTS_MAX).default(null),
});

const foundSchema = z.object({
  type: z.literal(PostType.ENCONTRADA),
  ...animalFields,
  ...placeFields,
  eventDate: eventDateSchema,
  description: descriptionSchema,
  showPhone: z.boolean().default(true),
  mediaIds: mediaIdsSchema,
});

const adoptionSchema = z.object({
  type: z.literal(PostType.ADOPCION),
  ...animalFields,
  ...placeFields,
  description: descriptionSchema,
  showPhone: z.boolean().default(true),
  mediaIds: mediaIdsSchema,
  adoption: adoptionDetailsSchema.default({
    approxAgeMonths: null,
    neutered: null,
    vaccinated: null,
    dewormed: null,
    requirements: null,
  }),
});

/** POST /posts: ENCONTRADA y ADOPCION (la PERDIDA se crea desde la mascota) */
export const createPostSchema = z.discriminatedUnion('type', [foundSchema, adoptionSchema]);
export type CreatePostInput = z.input<typeof createPostSchema>;
export type CreatePostData = z.output<typeof createPostSchema>;

/** PATCH /posts/:id. `mediaIds` no aplica a PERDIDA (usa las fotos de la mascota). */
export const updatePostSchema = z
  .object({
    neighborhoodId: z.uuid().nullable(),
    zoneText: optionalText(LIMITS.ZONE_MAX),
    eventDate: eventDateSchema,
    description: descriptionSchema,
    showPhone: z.boolean(),
    species: z.enum(Species),
    sex: z.enum(Sex),
    size: z.enum(PetSize).nullable(),
    color: optionalText(LIMITS.PET_TEXT_MAX),
    mediaIds: mediaIdsSchema,
    adoption: adoptionDetailsSchema.partial(),
  })
  .partial();
export type UpdatePostInput = z.input<typeof updatePostSchema>;
export type UpdatePostData = z.output<typeof updatePostSchema>;

export const resolvePostSchema = z.object({ resolution: z.enum(Resolution) });
export type ResolvePostInput = z.infer<typeof resolvePostSchema>;

export const feedQuerySchema = z.object({
  city: z.string().min(1).optional(),
  type: z.enum(PostType).optional(),
  species: z.enum(Species).optional(),
  neighborhoodId: z.uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LIMITS.FEED_PAGE_SIZE_MAX)
    .default(LIMITS.FEED_PAGE_SIZE),
});
export type FeedQuery = z.input<typeof feedQuerySchema>;

export type PostResponse = {
  id: string;
  shortId: string;
  type: PostType;
  status: PostStatus;
  species: Species;
  sex: Sex;
  size: PetSize | null;
  color: string | null;
  city: { slug: string; name: string };
  neighborhood: { id: string; name: string } | null;
  zoneText: string | null;
  eventDate: string;
  description: string;
  /** El número nunca viaja acá: se pide aparte con GET /posts/:id/contact */
  showPhone: boolean;
  canContact: boolean;
  photos: MediaResponse[];
  pet: {
    id: string;
    name: string;
    breed: string | null;
    approxBirthDate: string | null;
    distinctiveMarks: string | null;
  } | null;
  adoption: z.output<typeof adoptionDetailsSchema> | null;
  author: { id: string; name: string; avatarUrl: string | null };
  resolution: Resolution | null;
  resolvedAt: string | null;
  publishedAt: string;
};

export type FeedResponse = { items: PostResponse[]; nextCursor: string | null };

export type ContactResponse = { whatsappUrl: string };
