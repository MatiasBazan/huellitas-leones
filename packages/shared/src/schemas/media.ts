import { z } from 'zod';
import { MEDIA } from '../constants.js';

export const presignMediaSchema = z.object({
  contentType: z.enum(MEDIA.ALLOWED_TYPES),
  sizeBytes: z.number().int().positive().max(MEDIA.MAX_UPLOAD_BYTES, 'La foto pesa demasiado'),
  width: z.number().int().positive().max(10_000).optional(),
  height: z.number().int().positive().max(10_000).optional(),
});
export type PresignMediaInput = z.infer<typeof presignMediaSchema>;

export type PresignMediaResponse = {
  mediaId: string;
  /** Absoluta (R2) o relativa a la URL de la API (storage local de desarrollo) */
  uploadUrl: string;
  /** Headers que hay que mandar tal cual en el PUT */
  uploadHeaders: Record<string, string>;
};

export type MediaResponse = {
  id: string;
  /** Absoluta (R2) o relativa a la URL de la API (storage local de desarrollo) */
  url: string;
  width: number | null;
  height: number | null;
};
