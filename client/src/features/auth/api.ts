import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
}

export const authApi = {
  me: () => api<{ user: AuthUser }>('/auth/me'),
  login: (input: LoginInput) => api<{ user: AuthUser }>('/auth/login', { method: 'POST', body: input }),
  register: (input: RegisterInput) =>
    api<{ user: AuthUser }>('/auth/register', { method: 'POST', body: input }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
};
