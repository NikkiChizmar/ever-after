import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { weddingApi, type CreateWeddingInput } from './api';

export function useWeddings() {
  return useQuery({
    queryKey: ['weddings'],
    queryFn: async () => {
      const { weddings } = await weddingApi.list();
      return weddings;
    },
  });
}

export function useWedding(weddingId: string) {
  return useQuery({
    queryKey: ['weddings', weddingId],
    queryFn: () => weddingApi.get(weddingId),
  });
}

export function useMembers(weddingId: string) {
  return useQuery({
    queryKey: ['weddings', weddingId, 'members'],
    queryFn: async () => (await weddingApi.listMembers(weddingId)).members,
  });
}

export function useCreateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWeddingInput) => weddingApi.create(input),
    onSuccess: () => {
      // The list is now stale; let Query refetch it on next use.
      queryClient.invalidateQueries({ queryKey: ['weddings'] });
    },
  });
}
