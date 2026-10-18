import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { MediaResponse } from '@huellitas/shared';
import { mediaUrl } from '@/lib/config';
import { LogoSymbol } from './logo';

export function Gallery({ photos, label }: { photos: MediaResponse[]; label: string }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const height = Math.round(width * 0.85);

  if (!photos.length) {
    return (
      <View style={{ height: height * 0.6 }} className="items-center justify-center bg-brand-200">
        <LogoSymbol size={110} />
      </View>
    );
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {photos.map((photo, i) => (
          <Image
            key={photo.id}
            source={{ uri: mediaUrl(photo.url) }}
            style={{ width, height }}
            contentFit="cover"
            accessibilityLabel={`Foto ${i + 1} de ${label}`}
          />
        ))}
      </ScrollView>
      {photos.length > 1 ? (
        <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
          {photos.map((p, i) => (
            <View
              key={p.id}
              className={`h-2 rounded-full ${i === index ? 'w-5 bg-white' : 'w-2 bg-white/60'}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
