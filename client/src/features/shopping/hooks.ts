import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  shoppingItemApi,
  type CreateShoppingItemInput,
  type UpdateShoppingItemInput,
} from './api';

const itemsKey = (weddingId: string) => ['weddings', weddingId, 'shopping-items'];

export function useShoppingItems(weddingId: string) {
  return useQuery({
    queryKey: itemsKey(weddingId),
    queryFn: async () => (await shoppingItemApi.list(weddingId)).items,
  });
}

export function useCreateShoppingItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShoppingItemInput) => shoppingItemApi.create(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey(weddingId) }),
  });
}

export function useUpdateShoppingItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: UpdateShoppingItemInput }) =>
      shoppingItemApi.update(weddingId, itemId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey(weddingId) }),
  });
}

export function useDeleteShoppingItem(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => shoppingItemApi.remove(weddingId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey(weddingId) }),
  });
}
