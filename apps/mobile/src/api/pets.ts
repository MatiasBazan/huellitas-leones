import type { CreatePetInput, PetResponse, UpdatePetInput } from '@huellitas/shared';
import { api } from './client';

export const petsApi = {
  mine: () => api<PetResponse[]>('/pets/mine'),
  get: (id: string) => api<PetResponse>(`/pets/${id}`),
  create: (body: CreatePetInput) => api<PetResponse>('/pets', { method: 'POST', body }),
  update: (id: string, body: UpdatePetInput) =>
    api<PetResponse>(`/pets/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<void>(`/pets/${id}`, { method: 'DELETE' }),
};
