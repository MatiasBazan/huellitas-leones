import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { LIMITS } from '@huellitas/shared';
import { ActionSheet, type SheetOption } from '@/components/action-sheet';
import { Text } from '@/components/ui';
import { mediaUrl } from '@/lib/config';
import { PermissionDeniedError, pickPhotos, type PhotoSource } from '@/lib/images';
import { colors } from '@/theme';
import type { PhotoItem, PhotoUploads } from './use-photo-uploads';

function thumbUri(item: PhotoItem): string {
  return item.local?.uri ?? (item.status === 'ready' ? mediaUrl(item.media.url) : '');
}

export function PhotoPicker({
  uploads,
  max = LIMITS.PHOTOS_PER_PET,
  hint = 'Que se vea bien la cara y el cuerpo entero. La primera es la portada.',
}: {
  uploads: PhotoUploads;
  max?: number;
  hint?: string;
}) {
  const free = max - uploads.items.length;
  const [sheet, setSheet] = useState<{ title: string; options: SheetOption[] } | null>(null);

  async function pick(source: PhotoSource) {
    try {
      uploads.add(await pickPhotos(source, free));
    } catch (err) {
      if (err instanceof PermissionDeniedError) {
        Alert.alert('Sin permiso', 'Habilitá la cámara para Huellita Leones en los ajustes.');
      }
    }
  }

  function chooseSource() {
    setSheet({
      title: 'Agregar fotos',
      options: [
        { label: 'Sacar una foto', onPress: () => void pick('camera') },
        { label: 'Elegir de la galería', onPress: () => void pick('library') },
      ],
    });
  }

  function itemActions(item: PhotoItem, index: number) {
    setSheet({
      title: 'Foto',
      options: [
        ...(item.status === 'error'
          ? [{ label: 'Reintentar subida', onPress: () => uploads.retry(item.key) }]
          : []),
        ...(index > 0
          ? [{ label: 'Usar de portada', onPress: () => uploads.makeCover(item.key) }]
          : []),
        { label: 'Quitar', destructive: true, onPress: () => uploads.remove(item.key) },
      ],
    });
  }

  return (
    <View className="gap-1.5">
      <ActionSheet
        visible={!!sheet}
        title={sheet?.title}
        options={sheet?.options ?? []}
        onClose={() => setSheet(null)}
      />
      <Text variant="semibold" className="text-sm text-ink">
        Fotos ({uploads.items.length}/{max})
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {uploads.items.map((item, index) => (
          <Pressable
            key={item.key}
            accessibilityLabel={`Foto ${index + 1}${index === 0 ? ', portada' : ''}`}
            onPress={() => itemActions(item, index)}
            className="size-24 overflow-hidden rounded-2xl bg-brand-200"
          >
            <Image source={{ uri: thumbUri(item) }} style={{ flex: 1 }} contentFit="cover" />
            {item.status === 'uploading' ? (
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
            {item.status === 'error' ? (
              <View className="absolute inset-0 items-center justify-center bg-lost/70">
                <Ionicons name="refresh" size={24} color="#fff" />
              </View>
            ) : null}
            {index === 0 ? (
              <View className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-2 py-0.5">
                <Text variant="bold" className="text-[10px] text-white">
                  PORTADA
                </Text>
              </View>
            ) : null}
          </Pressable>
        ))}
        {free > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar fotos"
            onPress={chooseSource}
            className="size-24 items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-brand-500 bg-white"
          >
            <Ionicons name="camera" size={26} color={colors.brandStrong} />
            <Text variant="semibold" className="text-xs text-brand-600">
              Agregar
            </Text>
          </Pressable>
        ) : null}
      </View>
      {uploads.failed ? (
        <Text className="text-sm text-lost">
          Alguna foto no se pudo subir. Tocala para reintentar.
        </Text>
      ) : (
        <Text className="text-xs text-ink-muted">{hint}</Text>
      )}
    </View>
  );
}
