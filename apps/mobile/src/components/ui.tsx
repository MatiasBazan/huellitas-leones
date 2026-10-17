import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-brand-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerClassName="grow px-6 py-8" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
};

const buttonStyles = {
  primary: { box: 'bg-brand-600', text: 'text-white' },
  secondary: { box: 'bg-white border border-stone-300', text: 'text-ink' },
  ghost: { box: 'bg-transparent', text: 'text-brand-700' },
} as const;

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const s = buttonStyles[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      className={`h-12 flex-row items-center justify-center rounded-xl px-4 ${s.box} ${inactive ? 'opacity-60' : 'active:opacity-80'}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#C2410C'} />
      ) : (
        <Text className={`text-base font-semibold ${s.text}`}>{title}</Text>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string | undefined };

export function TextField({ label, error, ...input }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-ink">{label}</Text>
      <TextInput
        placeholderTextColor="#A8A29E"
        className={`h-12 rounded-xl border bg-white px-4 text-base text-ink ${error ? 'border-red-500' : 'border-stone-300'}`}
        {...input}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View className="rounded-xl bg-red-50 p-3">
      <Text className="text-sm text-red-700">{message}</Text>
    </View>
  );
}
