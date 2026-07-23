import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { taskApi, type CreateTaskInput, type UpdateTaskInput } from './api';

const tasksKey = (weddingId: string) => ['weddings', weddingId, 'tasks'];

export function useTasks(weddingId: string) {
  return useQuery({
    queryKey: tasksKey(weddingId),
    queryFn: async () => (await taskApi.list(weddingId)).tasks,
  });
}

export function useCreateTask(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskApi.create(weddingId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(weddingId) }),
  });
}

export function useUpdateTask(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      taskApi.update(weddingId, taskId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(weddingId) }),
  });
}

export function useDeleteTask(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => taskApi.remove(weddingId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(weddingId) }),
  });
}
