import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, FormError, Screen, Text, TextField } from '@/components/ui';
import { errorMessage, fieldErrors } from '@/features/auth/errors';
import { useUpdateMe } from '@/features/auth/hooks';
import { NeighborhoodPicker } from '@/features/posts/form-fields';
import { useSession } from '@/stores/session';

export default function EditProfileScreen() {
  const user = useSession((s) => s.user);
  const update = useUpdateMe();
  const [name, setName] = useState(user?.name ?? '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp?.replace(/^\+549/, '') ?? '');
  const [neighborhoodId, setNeighborhoodId] = useState(user?.neighborhood?.id ?? null);
  const errors = fieldErrors(update.error);

  return (
    <Screen>
      <View className="gap-5">
        <TextField label="Nombre" value={name} onChangeText={setName} error={errors['name']} />
        <View className="gap-1.5">
          <TextField
            label="WhatsApp"
            value={whatsapp}
            onChangeText={setWhatsapp}
            keyboardType="phone-pad"
            placeholder="353 4123456"
            error={errors['whatsapp']}
          />
          <Text className="text-xs text-ink-muted">
            No se muestra en ningún lado: cuando alguien toca “Contactar”, se abre WhatsApp.
          </Text>
        </View>
        <NeighborhoodPicker value={neighborhoodId} onChange={setNeighborhoodId} />
        <FormError
          message={update.error && !Object.keys(errors).length ? errorMessage(update.error) : null}
        />
        <Button
          title="Guardar"
          loading={update.isPending}
          onPress={() =>
            update.mutate(
              {
                name,
                whatsapp: whatsapp.trim() ? whatsapp : null,
                ...(neighborhoodId && { neighborhoodId }),
              },
              { onSuccess: () => router.back() },
            )
          }
        />
      </View>
    </Screen>
  );
}
