import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { MEDIA } from '@huellitas/shared';

export type LocalPhoto = { uri: string; width: number; height: number };
export type PhotoSource = 'camera' | 'library';

export class PermissionDeniedError extends Error {}

/** Devuelve [] si el usuario cancela */
export async function pickPhotos(source: PhotoSource, limit: number): Promise<LocalPhoto[]> {
  if (limit <= 0) return [];
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new PermissionDeniedError('Sin permiso para usar la cámara');
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: limit > 1,
      selectionLimit: limit,
      quality: 1,
    });
  }
  if (result.canceled) return [];
  return result.assets
    .slice(0, limit)
    .map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

/**
 * Lado mayor a 1600px y WebP. Reencodear también descarta el EXIF (incluida la ubicación GPS).
 */
export async function compressPhoto(photo: LocalPhoto): Promise<LocalPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  if (Math.max(photo.width, photo.height) > MEDIA.IMAGE_MAX_SIDE) {
    context.resize(
      photo.width >= photo.height
        ? { width: MEDIA.IMAGE_MAX_SIDE }
        : { height: MEDIA.IMAGE_MAX_SIDE },
    );
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.WEBP, compress: 0.8 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}
