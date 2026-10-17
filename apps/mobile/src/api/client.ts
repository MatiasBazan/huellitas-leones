import type { ApiError, AuthResponse } from '@huellitas/shared';
import { config } from '@/lib/config';
import { useSession } from '@/stores/session';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiError | null,
  ) {
    super(body?.message ?? `Error ${status}`);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** false para endpoints públicos (login, registro) */
  auth?: boolean;
};

async function rawRequest<T>(path: string, opts: RequestOptions, token: string | null): Promise<T> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new ApiRequestError(res.status, data as ApiError | null);
  return data as T;
}

// Un solo refresh en vuelo aunque fallen varias requests a la vez
let refreshing: Promise<AuthResponse> | null = null;

export function refreshSession(refreshToken: string): Promise<AuthResponse> {
  refreshing ??= rawRequest<AuthResponse>(
    '/auth/refresh',
    { method: 'POST', body: { refreshToken } },
    null,
  )
    .then(async (auth) => {
      await useSession.getState().setSession(auth);
      return auth;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const session = useSession.getState();
  if (opts.auth === false) return rawRequest<T>(path, opts, null);

  try {
    return await rawRequest<T>(path, opts, session.accessToken);
  } catch (err) {
    if (!(err instanceof ApiRequestError) || err.status !== 401 || !session.refreshToken) throw err;

    try {
      const { accessToken } = await refreshSession(session.refreshToken);
      return await rawRequest<T>(path, opts, accessToken);
    } catch (refreshErr) {
      if (refreshErr instanceof ApiRequestError && refreshErr.status === 401) {
        await useSession.getState().clear();
      }
      throw refreshErr;
    }
  }
}
