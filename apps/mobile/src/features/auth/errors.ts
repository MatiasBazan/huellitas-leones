import { ApiRequestError } from '@/api/client';

/** Errores de campo devueltos por la API (validación Zod) → { campo: mensaje } */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiRequestError) || !err.body?.issues) return {};
  return Object.fromEntries(err.body.issues.map((i) => [i.path, i.message]));
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof TypeError) return 'No pudimos conectarnos. Revisá tu conexión.';
  return 'Algo salió mal. Probá de nuevo.';
}
