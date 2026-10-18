import { useCallback, useRef, useState } from 'react';
import type { MediaResponse } from '@huellitas/shared';
import { uploadPhoto } from '@/api/media';
import { compressPhoto, type LocalPhoto } from '@/lib/images';

export type PhotoItem =
  | { key: string; status: 'uploading' | 'error'; local: LocalPhoto }
  | { key: string; status: 'ready'; media: MediaResponse; local?: LocalPhoto };

/**
 * Las fotos se suben apenas se eligen, así al guardar el formulario solo se mandan los ids.
 */
export function usePhotoUploads(initial: MediaResponse[] = []) {
  const [items, setItems] = useState<PhotoItem[]>(() =>
    initial.map((media) => ({ key: media.id, status: 'ready', media })),
  );
  const counter = useRef(0);

  const upload = useCallback(async (key: string, original: LocalPhoto) => {
    try {
      const compressed = await compressPhoto(original);
      setItems((prev) =>
        prev.map((it) => (it.key === key ? { key, status: 'uploading', local: compressed } : it)),
      );
      const media = await uploadPhoto(compressed);
      setItems((prev) =>
        prev.map((it) =>
          it.key === key ? { key, status: 'ready', media, local: compressed } : it,
        ),
      );
    } catch {
      setItems((prev) =>
        prev.map((it) => (it.key === key ? { key, status: 'error', local: original } : it)),
      );
    }
  }, []);

  const add = useCallback(
    (photos: LocalPhoto[]) => {
      const added = photos.map((local) => ({
        key: `local-${counter.current++}`,
        status: 'uploading' as const,
        local,
      }));
      setItems((prev) => [...prev, ...added]);
      for (const it of added) void upload(it.key, it.local);
    },
    [upload],
  );

  const retry = useCallback(
    (key: string) => {
      const item = items.find((it) => it.key === key);
      if (item?.status !== 'error') return;
      setItems((prev) =>
        prev.map((it) => (it.key === key ? { ...item, status: 'uploading' } : it)),
      );
      void upload(key, item.local);
    },
    [items, upload],
  );

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  /** Pasa la foto al primer lugar (portada) */
  const makeCover = useCallback((key: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.key === key);
      return item ? [item, ...prev.filter((it) => it.key !== key)] : prev;
    });
  }, []);

  return {
    items,
    add,
    retry,
    remove,
    makeCover,
    uploading: items.some((it) => it.status === 'uploading'),
    failed: items.some((it) => it.status === 'error'),
    mediaIds: items.flatMap((it) => (it.status === 'ready' ? [it.media.id] : [])),
  };
}

export type PhotoUploads = ReturnType<typeof usePhotoUploads>;
