import type { PostResponse } from './schemas/posts.js';
import type { PostType, Resolution } from './enums.js';
import { SPECIES_LABEL } from './pets.js';

export const POST_TYPE_LABEL: Record<PostType, string> = {
  PERDIDA: 'Perdida',
  ENCONTRADA: 'Encontrada',
  ADOPCION: 'En adopción',
};

export const RESOLUTION_LABEL: Record<Resolution, string> = {
  REENCONTRADA: 'Volvió a casa',
  ADOPTADA: 'Adoptada',
  OTRO: 'Resuelta',
};

/** "Toby" si tiene nombre; si no "Perro encontrado", "Gata en adopción"… */
export function postTitle(post: Pick<PostResponse, 'pet' | 'species' | 'type' | 'sex'>): string {
  if (post.pet) return post.pet.name;
  const female = post.sex === 'HEMBRA';
  const animal =
    post.species === 'OTRO'
      ? 'Mascota'
      : female
        ? SPECIES_LABEL[post.species].replace(/o$/, 'a')
        : SPECIES_LABEL[post.species];
  const suffix =
    post.type === 'ADOPCION'
      ? 'en adopción'
      : post.species === 'OTRO' || female
        ? 'encontrada'
        : 'encontrado';
  return `${animal} ${suffix}`;
}

/** "hace 5 min", "hace 3 h", "ayer", "hace 4 días", "12/03/2026" */
export function timeAgo(iso: string, now = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Mensaje prearmado para WhatsApp */
export function contactMessage(title: string, type: PostType, url: string): string {
  const intro =
    type === 'PERDIDA'
      ? `¡Hola! Te escribo por ${title}, que publicaste como perdida en Huellita Leones.`
      : type === 'ENCONTRADA'
        ? `¡Hola! Te escribo por la mascota que encontraste (${title}) en Huellita Leones.`
        : `¡Hola! Me interesa adoptar a ${title}, que publicaste en Huellita Leones.`;
  return `${intro}\n${url}`;
}
