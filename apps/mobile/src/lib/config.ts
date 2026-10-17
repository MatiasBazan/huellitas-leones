import Constants from 'expo-constants';

/**
 * En desarrollo, si no hay EXPO_PUBLIC_API_URL, usa la IP de la máquina que corre Metro
 * (la misma que ya alcanza el celular) con el puerto de la API.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (__DEV__ && host) return `http://${host}:3100/api/v1`;

  throw new Error('Falta EXPO_PUBLIC_API_URL');
}

export const config = {
  apiUrl: resolveApiUrl(),
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
} as const;
