import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { citiesApi } from '@/api/auth';
import { Button, FormError, Screen, TextField } from '@/components/ui';
import { errorMessage, fieldErrors } from '@/features/auth/errors';
import { useLogout, useUpdateMe } from '@/features/auth/hooks';
import { useSession } from '@/stores/session';

export default function CompleteProfileScreen() {
  const user = useSession((s) => s.user);
  const citySlug = user?.city.slug ?? '';
  const neighborhoods = useQuery({
    queryKey: ['neighborhoods', citySlug],
    queryFn: () => citiesApi.neighborhoods(citySlug),
    enabled: !!citySlug,
  });

  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? '');
  const update = useUpdateMe();
  const logout = useLogout();
  const errors = fieldErrors(update.error);

  return (
    <Screen>
      <View className="flex-1 gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-ink">¡Hola, {user?.name}!</Text>
          <Text className="text-base text-ink-muted">
            Contanos tu barrio en {user?.city.name} para mostrarte lo que pasa cerca.
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-ink">Barrio</Text>
          {neighborhoods.isLoading ? <ActivityIndicator /> : null}
          <View className="flex-row flex-wrap gap-2">
            {neighborhoods.data?.map((n) => {
              const selected = n.id === neighborhoodId;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => setNeighborhoodId(n.id)}
                  className={`rounded-full border px-4 py-2 ${selected ? 'border-brand-600 bg-brand-600' : 'border-stone-300 bg-white'}`}
                >
                  <Text className={selected ? 'font-semibold text-white' : 'text-ink'}>
                    {n.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <TextField
            label="WhatsApp (opcional)"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            placeholder="353 4123456"
            error={errors['whatsapp']}
          />
          <Text className="text-xs text-ink-muted">
            Lo usamos para que te contacten cuando publiques una mascota. Podés borrarlo cuando
            quieras.
          </Text>
        </View>

        <FormError
          message={
            update.error && !Object.keys(errors).length ? errorMessage(update.error) : null
          }
        />
        <Button
          title="Listo"
          disabled={!neighborhoodId}
          loading={update.isPending}
          onPress={() =>
            update.mutate({ neighborhoodId, whatsapp: whatsapp.trim() ? whatsapp : null })
          }
        />
        <Button title="Cerrar sesión" variant="ghost" onPress={() => logout.mutate()} />
      </View>
    </Screen>
  );
}
