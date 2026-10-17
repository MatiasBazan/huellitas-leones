import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, FormError, Screen, TextField } from '@/components/ui';
import { errorMessage, fieldErrors } from '@/features/auth/errors';
import { useRegister } from '@/features/auth/hooks';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const register = useRegister();
  const errors = fieldErrors(register.error);
  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <Screen>
      <View className="flex-1 justify-center gap-6">
        <Text className="text-3xl font-bold text-ink">Crear cuenta</Text>
        <View className="gap-4">
          <TextField
            label="Nombre"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            error={errors['name']}
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            error={errors['email']}
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            error={errors['password']}
          />
          <FormError
            message={register.error && !hasFieldErrors ? errorMessage(register.error) : null}
          />
          <Button
            title="Crear cuenta"
            loading={register.isPending}
            onPress={() => register.mutate({ name, email, password })}
          />
          <Button title="Ya tengo cuenta" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}
