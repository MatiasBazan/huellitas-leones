import type { MediaResponse, PresignMediaResponse } from '@huellitas/shared';
import { mediaUrl } from '@/lib/config';
import type { LocalPhoto } from '@/lib/images';
import { api } from './client';

/** presign → PUT directo al bucket → confirm */
export async function uploadPhoto(photo: LocalPhoto): Promise<MediaResponse> {
  const blob = await (await fetch(photo.uri)).blob();
  const target = await api<PresignMediaResponse>('/media/presign', {
    method: 'POST',
    body: {
      contentType: 'image/webp',
      sizeBytes: blob.size,
      width: photo.width,
      height: photo.height,
    },
  });
  const res = await fetch(mediaUrl(target.uploadUrl), {
    method: 'PUT',
    headers: target.uploadHeaders,
    body: blob,
  });
  if (!res.ok) throw new Error(`Falló la subida (${res.status})`);
  return api<MediaResponse>(`/media/${target.mediaId}/confirm`, { method: 'POST' });
}
