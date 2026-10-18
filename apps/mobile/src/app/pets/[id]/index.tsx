import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  ageLabel,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
  type PetResponse,
} from '@huellitas/shared';
import { LogoSymbol } from '@/components/logo';
import { Button, FormError, Text } from '@/components/ui';
import { errorMessage } from '@/features/auth/errors';
import { useDeletePet, usePet } from '@/features/pets/hooks';
import { PetStatusBadge } from '@/features/pets/pet-card';
import { mediaUrl } from '@/lib/config';
import { colors } from '@/theme';

function Gallery({ pet }: { pet: PetResponse }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const height = Math.round(width * 0.85);

  if (!pet.photos.length) {
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
        {pet.photos.map((photo, i) => (
          <Image
            key={photo.id}
            source={{ uri: mediaUrl(photo.url) }}
            style={{ width, height }}
            contentFit="cover"
            accessibilityLabel={`Foto ${i + 1} de ${pet.name}`}
          />
        ))}
      </ScrollView>
      {pet.photos.length > 1 ? (
        <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
          {pet.photos.map((p, i) => (
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-0.5 rounded-2xl bg-white p-3">
      <Text className="text-xs text-ink-muted">{label}</Text>
      <Text variant="semibold" className="text-base text-ink">
        {value}
      </Text>
    </View>
  );
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePet(id);
  const remove = useDeletePet();

  if (!pet.data) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-50 p-6">
        {pet.error ? (
          <FormError message={errorMessage(pet.error)} />
        ) : (
          <ActivityIndicator color={colors.brandStrong} />
        )}
      </View>
    );
  }

  const p = pet.data;

  function confirmDelete() {
    Alert.alert(`¿Eliminar a ${p.name}?`, 'Se borra de tus mascotas. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => remove.mutate(p.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-brand-50" contentContainerClassName="pb-10">
      <Stack.Screen options={{ title: p.name }} />
      <Gallery pet={p} />
      <View className="gap-5 px-5 pt-5">
        <View className="gap-2">
          <PetStatusBadge status={p.status} />
          <Text variant="heading" className="text-4xl leading-[44px] text-ink">
            {p.name}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Fact label="Especie" value={SPECIES_LABEL[p.species]} />
          <Fact label="Sexo" value={SEX_LABEL[p.sex]} />
          {p.breed ? <Fact label="Raza" value={p.breed} /> : null}
          <Fact label="Color" value={p.color} />
          {p.size ? <Fact label="Tamaño" value={SIZE_LABEL[p.size]} /> : null}
          {p.approxBirthDate ? <Fact label="Edad" value={ageLabel(p.approxBirthDate)} /> : null}
        </View>

        {p.distinctiveMarks ? (
          <View className="gap-1">
            <Text variant="headingBold" className="text-lg text-ink">
              Señas particulares
            </Text>
            <Text className="text-base leading-6 text-ink">{p.distinctiveMarks}</Text>
          </View>
        ) : null}

        <FormError message={remove.error ? errorMessage(remove.error) : null} />
        <View className="gap-3">
          <Button
            title="Editar"
            variant="secondary"
            onPress={() => router.push({ pathname: '/pets/[id]/edit', params: { id: p.id } })}
          />
          <Button
            title="Eliminar"
            variant="ghost"
            loading={remove.isPending}
            onPress={confirmDelete}
          />
        </View>
      </View>
    </ScrollView>
  );
}
