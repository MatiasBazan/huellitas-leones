import * as SecureStore from 'expo-secure-store';

// Keystore (Android) / Keychain (iOS). La variante .web.ts existe solo para previsualizar en el navegador.
export const secureStorage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};
