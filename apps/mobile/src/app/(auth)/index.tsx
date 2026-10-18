import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Logo } from '@/components/logo';
import { Button, FormError, Screen, Text, TextField } from '@/components/ui';
import { errorMessage, fieldErrors } from '@/features/auth/errors';
import { useGoogleLogin, useLogin } from '@/features/auth/hooks';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const google = useGoogleLogin();
  const errors = fieldErrors(login.error);
  const generalError = login.error ?? google.error;

  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <View className="gap-4">
          <Logo />
          <Text className="text-base text-ink-muted">
            Mascotas perdidas, encontradas y en adopción de tu ciudad.
          </Text>
        </View>

        <View className="gap-4">
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
            autoComplete="current-password"
            error={errors['password']}
          />
          <FormError message={generalError ? errorMessage(generalError) : null} />
          <Button
            title="Ingresar"
            loading={login.isPending}
            onPress={() => login.mutate({ email, password })}
          />
          <Button
            title="Continuar con Google"
            variant="secondary"
            loading={google.isPending}
            onPress={() => google.mutate()}
          />
        </View>

        <Link href="/register" asChild>
          <Text className="text-center text-base text-brand-600">
            ¿No tenés cuenta? <Text variant="bold">Registrate</Text>
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
