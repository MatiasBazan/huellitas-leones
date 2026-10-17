import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginInput, RegisterInput, UpdateMeInput } from '@huellitas/shared';
import { authApi, usersApi } from '@/api/auth';
import { config } from '@/lib/config';
import { useSession } from '@/stores/session';

let googleConfigured = false;

function configureGoogle(): void {
  if (googleConfigured) return;
  if (!config.googleWebClientId) throw new Error('Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
  GoogleSignin.configure({ webClientId: config.googleWebClientId });
  googleConfigured = true;
}

export function useLogin() {
  const setSession = useSession((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: setSession,
  });
}

export function useRegister() {
  const setSession = useSession((s) => s.setSession);
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: setSession,
  });
}

/** Devuelve null si el usuario cancela el selector de cuentas */
export function useGoogleLogin() {
  const setSession = useSession((s) => s.setSession);
  return useMutation({
    mutationFn: async () => {
      configureGoogle();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try {
        const res = await GoogleSignin.signIn();
        if (!isSuccessResponse(res) || !res.data.idToken) return null;
        return authApi.google(res.data.idToken);
      } catch (err) {
        if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return null;
        throw err;
      }
    },
    onSuccess: async (auth) => {
      if (auth) await setSession(auth);
    },
  });
}

export function useUpdateMe() {
  const setUser = useSession((s) => s.setUser);
  return useMutation({
    mutationFn: (input: UpdateMeInput) => usersApi.updateMe(input),
    onSuccess: setUser,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { refreshToken, clear } = useSession.getState();
      // Si la API no responde igual cerramos la sesión local
      if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
      if (googleConfigured) await GoogleSignin.signOut().catch(() => undefined);
      await clear();
      queryClient.clear();
    },
  });
}
