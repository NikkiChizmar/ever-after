import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';
import { authApi, type LoginInput, type RegisterInput } from './api';

/**
 * "Who am I" is server state like any other — a query, not a context.
 * A 401 resolves to null (a *known* logged-out state, not an error),
 * so consumers just check `user == null`.
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const { user } = await authApi.me();
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: ({ user }) => {
      // Seed the cache directly — no need to refetch /me for data we hold.
      queryClient.setQueryData(['auth', 'me'], user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['auth', 'me'], user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Everything cached belongs to the person who just left.
      queryClient.clear();
    },
  });
}
