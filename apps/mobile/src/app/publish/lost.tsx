import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Button, Screen, Text } from '@/components/ui';
import { useMyPets } from '@/features/pets/hooks';
import { PetCard } from '@/features/pets/pet-card';
import { colors } from '@/theme';

export default function ChooseLostPetScreen() {
  const pets = useMyPets();
  const atHome = pets.data?.filter((p) => p.status === 'EN_CASA') ?? [];
  const lost = pets.data?.filter((p) => p.status === 'PERDIDA') ?? [];

  return (
    <Screen>
      <View className="gap-4">
        {pets.isPending ? <ActivityIndicator color={colors.brandStrong} /> : null}
        {pets.data && !pets.data.length ? (
          <View className="gap-4">
            <Text className="text-base text-ink">
              Para avisar que se perdió, primero cargá a tu mascota con fotos y señas. Es un minuto.
            </Text>
            <Button title="Cargar mi mascota" onPress={() => router.push('/pets/new')} />
          </View>
        ) : null}
        {atHome.length ? <Text className="text-base text-ink-muted">¿Cuál se perdió?</Text> : null}
        {atHome.map((pet) => (
          <View key={pet.id}>
            <PetCard
              pet={pet}
              href={{ pathname: '/pets/[id]/report-lost', params: { id: pet.id } }}
            />
          </View>
        ))}
        {lost.length ? (
          <Text className="pt-2 text-sm text-ink-muted">Ya están publicadas como perdidas:</Text>
        ) : null}
        {lost.map((pet) => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </View>
    </Screen>
  );
}
