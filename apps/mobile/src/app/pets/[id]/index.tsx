import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { ageLabel, SEX_LABEL, SIZE_LABEL, SPECIES_LABEL } from '@huellitas/shared';
import { Gallery } from '@/components/gallery';
import { Button, FormError, Text } from '@/components/ui';
import { errorMessage } from '@/features/auth/errors';
import { useDeletePet, usePet } from '@/features/pets/hooks';
import { PetStatusBadge } from '@/features/pets/pet-card';
import { confirmAction } from '@/lib/dialogs';
import { colors } from '@/theme';

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

  async function confirmDelete() {
    const ok = await confirmAction({
      title: `¿Eliminar a ${p.name}?`,
      message: 'Se borra de tus mascotas. No se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(p.id, { onSuccess: () => router.back() });
  }

  return (
    <ScrollView className="flex-1 bg-brand-50" contentContainerClassName="pb-10">
      <Stack.Screen options={{ title: p.name }} />
      <Gallery photos={p.photos} label={p.name} />
      <View className="gap-5 px-5 pt-5">
        <View className="gap-2">
          <PetStatusBadge status={p.status} />
          <Text variant="heading" className="text-4xl leading-[44px] text-ink">
            {p.name}
          </Text>
        </View>

        {p.activeLostPost ? (
          <Button
            title="Ver la publicación de búsqueda"
            onPress={() =>
              router.push({
                pathname: '/post/[shortId]',
                params: { shortId: p.activeLostPost!.shortId },
              })
            }
          />
        ) : (
          <Button
            title={`Se perdió ${p.name}`}
            onPress={() =>
              router.push({ pathname: '/pets/[id]/report-lost', params: { id: p.id } })
            }
          />
        )}

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
            onPress={() => void confirmDelete()}
          />
        </View>
      </View>
    </ScrollView>
  );
}
