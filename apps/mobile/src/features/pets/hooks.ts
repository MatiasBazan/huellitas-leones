import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePetInput, PetResponse } from '@huellitas/shared';
import { petsApi } from '@/api/pets';

export const petKeys = {
  mine: ['pets', 'mine'] as const,
  detail: (id: string) => ['pets', id] as const,
};

export function useMyPets() {
  return useQuery({ queryKey: petKeys.mine, queryFn: petsApi.mine });
}

export function usePet(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => petsApi.get(id),
    // Abre al toque si venimos de la lista
    initialData: () =>
      queryClient.getQueryData<PetResponse[]>(petKeys.mine)?.find((p) => p.id === id),
  });
}

/** Crea si no hay id, si no edita */
export function useSavePet(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePetInput) => (id ? petsApi.update(id, input) : petsApi.create(input)),
    onSuccess: (pet) => {
      queryClient.setQueryData(petKeys.detail(pet.id), pet);
      void queryClient.invalidateQueries({ queryKey: petKeys.mine });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => petsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: petKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: petKeys.mine });
    },
  });
}
