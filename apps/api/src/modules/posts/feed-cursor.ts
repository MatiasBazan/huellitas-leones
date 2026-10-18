import { BadRequestException } from '@nestjs/common';

/** Cursor opaco: posición (publishedAt, id) del último ítem de la página */
export type FeedCursor = { publishedAt: Date; id: string };

export function encodeCursor(c: FeedCursor): string {
  return Buffer.from(`${c.publishedAt.toISOString()}|${c.id}`).toString('base64url');
}

export function decodeCursor(raw: string): FeedCursor {
  const [date, id] = Buffer.from(raw, 'base64url').toString().split('|');
  const publishedAt = new Date(date ?? '');
  if (!id || Number.isNaN(publishedAt.getTime())) throw new BadRequestException('Cursor inválido');
  return { publishedAt, id };
}
