import { z } from 'zod';
import { LIMITS } from '../constants.js';
import { PetSize, PetStatus, Sex, Species } from '../enums.js';
import type { MediaResponse } from './media.js';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null));

export const petBaseSchema = z.object({
  name: z.string().trim().min(1, 'Poné el nombre').max(LIMITS.PET_NAME_MAX),
  species: z.enum(Species),
  breed: optionalText(LIMITS.PET_TEXT_MAX),
  color: z.string().trim().min(1, 'Contanos de qué color es').max(LIMITS.PET_TEXT_MAX),
  sex: z.enum(Sex),
  size: z.enum(PetSize).nullable(),
  /** YYYY-MM-DD; la app la calcula a partir de la edad aproximada */
  approxBirthDate: z.iso
    .date()
    .refine((d) => new Date(d) <= new Date(), 'La fecha no puede ser futura')
    .nullable(),
  distinctiveMarks: optionalText(LIMITS.PET_MARKS_MAX),
  /** Fotos ya confirmadas, en el orden en que se muestran (la primera es la portada) */
  mediaIds: z
    .array(z.uuid())
    .max(LIMITS.PHOTOS_PER_PET, `Hasta ${LIMITS.PHOTOS_PER_PET} fotos`)
    .refine((ids) => new Set(ids).size === ids.length, 'Fotos repetidas'),
});

export const createPetSchema = petBaseSchema.extend({
  breed: petBaseSchema.shape.breed.default(null),
  sex: petBaseSchema.shape.sex.default(Sex.DESCONOCIDO),
  size: petBaseSchema.shape.size.default(null),
  approxBirthDate: petBaseSchema.shape.approxBirthDate.default(null),
  distinctiveMarks: petBaseSchema.shape.distinctiveMarks.default(null),
  mediaIds: petBaseSchema.shape.mediaIds.default([]),
});
export type CreatePetInput = z.input<typeof createPetSchema>;
export type CreatePetData = z.output<typeof createPetSchema>;

/** PATCH parcial; si viene `mediaIds` reemplaza las fotos y su orden */
export const updatePetSchema = petBaseSchema.partial();
export type UpdatePetInput = z.input<typeof updatePetSchema>;
export type UpdatePetData = z.output<typeof updatePetSchema>;

export type PetResponse = {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  color: string;
  sex: Sex;
  size: PetSize | null;
  approxBirthDate: string | null;
  distinctiveMarks: string | null;
  status: PetStatus;
  photos: MediaResponse[];
  /** La publicación PERDIDA activa, si la hay */
  activeLostPost: { id: string; shortId: string } | null;
  createdAt: string;
  updatedAt: string;
};
