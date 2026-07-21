import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { budgetApi, type CreateCategoryInput, type UpdateCategoryInput } from './api';

const summaryKey = (weddingId: string) => ['weddings', weddingId, 'budget-summary'];

export function useBudgetSummary(weddingId: string) {
  return useQuery({
    queryKey: summaryKey(weddingId),
    queryFn: () => budgetApi.summary(weddingId),
  });
}

export function useCreateCategory(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => budgetApi.createCategory(weddingId, input),
    // The summary aggregates categories, so any category write invalidates it.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: summaryKey(weddingId) }),
  });
}

export function useUpdateCategory(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, input }: { categoryId: string; input: UpdateCategoryInput }) =>
      budgetApi.updateCategory(weddingId, categoryId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: summaryKey(weddingId) }),
  });
}

export function useDeleteCategory(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => budgetApi.deleteCategory(weddingId, categoryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: summaryKey(weddingId) }),
  });
}
