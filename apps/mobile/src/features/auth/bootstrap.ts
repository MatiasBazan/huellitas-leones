import { ApiRequestError, refreshSession } from '@/api/client';
import { useSession } from '@/stores/session';

/**
 * Al abrir la app: si hay un refresh guardado, lo canjea por una sesión nueva.
 * Si la API lo rechaza se borra; si es un problema de red se conserva para el próximo intento.
 */
export async function bootstrapSession(): Promise<void> {
  const { loadStoredRefresh, clear } = useSession.getState();
  const stored = await loadStoredRefresh();
  if (!stored) {
    await clear();
    return;
  }

  try {
    await refreshSession(stored);
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 401) {
      await clear();
    } else {
      useSession.setState({ status: 'signedOut' });
    }
  }
}
