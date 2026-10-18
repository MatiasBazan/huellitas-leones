import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Screen } from '@/components/ui';
import { usePet, useSavePet } from '@/features/pets/hooks';
import { PetForm } from '@/features/pets/pet-form';
import { colors } from '@/theme';

export default function EditPetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePet(id);
  const save = useSavePet(id);

  return (
    <Screen>
      {pet.data ? (
        <PetForm
          initial={pet.data}
          submitLabel="Guardar cambios"
          submitting={save.isPending}
          error={save.error}
          onSubmit={(input) => save.mutate(input, { onSuccess: () => router.back() })}
        />
      ) : (
        <ActivityIndicator color={colors.brandStrong} />
      )}
    </Screen>
  );
}
