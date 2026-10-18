import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import { ageLabel, SPECIES_LABEL, type PetResponse } from '@huellitas/shared';
import { LogoSymbol } from '@/components/logo';
import { Text } from '@/components/ui';
import { mediaUrl } from '@/lib/config';

export function petSummary(pet: PetResponse): string {
  return [
    SPECIES_LABEL[pet.species],
    pet.breed,
    pet.approxBirthDate ? ageLabel(pet.approxBirthDate) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function PetStatusBadge({ status }: { status: PetResponse['status'] }) {
  if (status !== 'PERDIDA') return null;
  return (
    <View className="self-start rounded-full bg-lost px-3 py-1">
      <Text variant="bold" className="text-xs tracking-wider text-white">
        PERDIDA
      </Text>
    </View>
  );
}

export function PetCard({ pet }: { pet: PetResponse }) {
  const cover = pet.photos[0];
  return (
    <Link href={{ pathname: '/pets/[id]', params: { id: pet.id } }} asChild>
      <Pressable className="flex-row items-center gap-4 rounded-3xl bg-white p-3 active:opacity-80">
        <View className="size-20 items-center justify-center overflow-hidden rounded-2xl bg-brand-200">
          {cover ? (
            <Image
              source={{ uri: mediaUrl(cover.url) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <LogoSymbol size={48} />
          )}
        </View>
        <View className="flex-1 gap-1">
          <Text variant="headingBold" className="text-xl text-ink">
            {pet.name}
          </Text>
          <Text className="text-sm text-ink-muted" numberOfLines={1}>
            {petSummary(pet)}
          </Text>
          <PetStatusBadge status={pet.status} />
        </View>
      </Pressable>
    </Link>
  );
}
