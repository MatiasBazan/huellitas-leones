import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

// Un solo font-* por texto: en React Native cada peso es una familia distinta
const textVariants = {
  body: 'font-body',
  semibold: 'font-body-semibold',
  bold: 'font-body-bold',
  heading: 'font-heading',
  headingBold: 'font-heading-bold',
} as const;

export function Text({
  variant = 'body',
  className = '',
  ...props
}: TextProps & { variant?: keyof typeof textVariants; className?: string }) {
  return <RNText className={`${textVariants[variant]} ${className}`} {...props} />;
}

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
  secondary: { box: 'bg-white border-2 border-ink', text: 'text-ink' },
  ghost: { box: 'bg-transparent', text: 'text-brand-600' },
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
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.brandStrong} />
      ) : (
        <Text variant="bold" className={`text-base ${s.text}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string | undefined };

export function TextField({ label, error, ...input }: FieldProps) {
  return (
    <View className="gap-1.5">
      <Text variant="semibold" className="text-sm text-ink">
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.placeholder}
        className={`h-12 rounded-xl border bg-white px-4 font-body text-base text-ink ${error ? 'border-lost' : 'border-line'}`}
        {...input}
      />
      {error ? <Text className="text-sm text-lost">{error}</Text> : null}
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
