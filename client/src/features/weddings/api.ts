import { api } from '@/lib/api';

export interface Wedding {
  id: string;
  name: string;
  weddingDate: string | null; // YYYY-MM-DD
  currency: string;
  totalBudget: string | null; // numeric arrives as string — exact money
  createdAt: string;
}

export type WeddingRole = 'owner' | 'editor' | 'viewer';

export interface CreateWeddingInput {
  name: string;
  weddingDate?: string;
  totalBudget?: number;
}

export const weddingApi = {
  list: () => api<{ weddings: (Wedding & { role: WeddingRole })[] }>('/weddings'),
  get: (id: string) => api<{ wedding: Wedding; role: WeddingRole }>(`/weddings/${id}`),
  create: (input: CreateWeddingInput) =>
    api<{ wedding: Wedding }>('/weddings', { method: 'POST', body: input }),
};
