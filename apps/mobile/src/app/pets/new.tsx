import { router } from 'expo-router';
import { Screen } from '@/components/ui';
import { useSavePet } from '@/features/pets/hooks';
import { PetForm } from '@/features/pets/pet-form';

export default function NewPetScreen() {
  const save = useSavePet();
  return (
    <Screen>
      <PetForm
        submitLabel="Guardar mascota"
        submitting={save.isPending}
        error={save.error}
        onSubmit={(input) =>
          save.mutate(input, {
            onSuccess: (pet) => router.replace({ pathname: '/pets/[id]', params: { id: pet.id } }),
          })
        }
      />
    </Screen>
  );
}
