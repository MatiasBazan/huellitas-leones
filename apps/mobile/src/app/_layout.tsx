import '../global.css';

// Imports por peso: el índice del paquete metería todas las variantes en el bundle
import { Baloo2_700Bold } from '@expo-google-fonts/baloo-2/700Bold';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2/800ExtraBold';
import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans/400Regular';
import { NunitoSans_600SemiBold } from '@expo-google-fonts/nunito-sans/600SemiBold';
import { NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans/700Bold';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { bootstrapSession } from '@/features/auth/bootstrap';
import { useSession } from '@/stores/session';
import { colors, fonts } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const withHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.crema },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.headingBold },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
} as const;

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const status = useSession((s) => s.status);
  const profileIncomplete = useSession((s) => s.user?.profileIncomplete ?? false);
  // Si una fuente falla, seguimos con la del sistema en vez de trabar el splash
  const [fontsLoaded, fontError] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });
  const ready = status !== 'loading' && (fontsLoaded || !!fontError);

  useEffect(() => {
    void bootstrapSession();
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = status === 'signedIn';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && profileIncomplete}>
          <Stack.Screen name="complete-profile" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !profileIncomplete}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="pets/new" options={{ ...withHeader, title: 'Nueva mascota' }} />
          <Stack.Screen name="pets/[id]/index" options={{ ...withHeader, title: '' }} />
          <Stack.Screen
            name="pets/[id]/edit"
            options={{ ...withHeader, title: 'Editar mascota' }}
          />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
