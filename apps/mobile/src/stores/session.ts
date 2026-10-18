import type { AuthResponse, MeResponse } from '@huellitas/shared';
import { secureStorage } from '@/lib/secure-storage';
import { create } from 'zustand';

const REFRESH_KEY = 'huellitas.refreshToken';

type SessionState = {
  status: 'loading' | 'signedOut' | 'signedIn';
  accessToken: string | null;
  refreshToken: string | null;
  user: MeResponse | null;
  /** lee el refresh guardado; el root layout después intenta renovarlo */
  loadStoredRefresh: () => Promise<string | null>;
  setSession: (auth: AuthResponse) => Promise<void>;
  setUser: (user: MeResponse) => void;
  clear: () => Promise<void>;
};

// El access token vive solo en memoria; el refresh en el keystore del sistema
export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  accessToken: null,
  refreshToken: null,
  user: null,

  loadStoredRefresh: () => secureStorage.get(REFRESH_KEY),

  setSession: async ({ accessToken, refreshToken, user }) => {
    await secureStorage.set(REFRESH_KEY, refreshToken);
    set({ status: 'signedIn', accessToken, refreshToken, user });
  },

  setUser: (user) => set({ user }),

  clear: async () => {
    await secureStorage.remove(REFRESH_KEY);
    set({ status: 'signedOut', accessToken: null, refreshToken: null, user: null });
  },
}));
