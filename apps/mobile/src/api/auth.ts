import type {
  AuthResponse,
  LoginInput,
  MeResponse,
  NeighborhoodResponse,
  RegisterInput,
  UpdateMeInput,
} from '@huellitas/shared';
import { api } from './client';

export const authApi = {
  register: (body: RegisterInput) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body, auth: false }),
  login: (body: LoginInput) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body, auth: false }),
  google: (idToken: string) =>
    api<AuthResponse>('/auth/google', { method: 'POST', body: { idToken }, auth: false }),
  logout: (refreshToken: string) =>
    api<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
};

export const usersApi = {
  me: () => api<MeResponse>('/users/me'),
  updateMe: (body: UpdateMeInput) => api<MeResponse>('/users/me', { method: 'PATCH', body }),
};

export const citiesApi = {
  neighborhoods: (citySlug: string) =>
    api<NeighborhoodResponse[]>(`/cities/${citySlug}/neighborhoods`, { auth: false }),
};
