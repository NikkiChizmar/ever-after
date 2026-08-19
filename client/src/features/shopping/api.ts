import { api } from '@/lib/api';

export interface ShoppingItem {
  id: string;
  weddingId: string;
  name: string;
  quantity: number;
  estimatedCost: string | null; // decimal string, like other money fields
  store: string | null;
  purchased: boolean;
  createdAt: string;
}

export interface CreateShoppingItemInput {
  name: string;
  quantity?: number;
  estimatedCost?: number | null;
  store?: string | null;
  purchased?: boolean;
}

export interface UpdateShoppingItemInput {
  name?: string;
  quantity?: number;
  estimatedCost?: number | null;
  store?: string | null;
  purchased?: boolean;
}

export const shoppingItemApi = {
  list: (weddingId: string) => api<{ items: ShoppingItem[] }>(`/weddings/${weddingId}/shopping-items`),
  create: (weddingId: string, input: CreateShoppingItemInput) =>
    api<{ item: ShoppingItem }>(`/weddings/${weddingId}/shopping-items`, { method: 'POST', body: input }),
  update: (weddingId: string, itemId: string, input: UpdateShoppingItemInput) =>
    api<{ item: ShoppingItem }>(`/weddings/${weddingId}/shopping-items/${itemId}`, {
      method: 'PATCH',
      body: input,
    }),
  remove: (weddingId: string, itemId: string) =>
    api<void>(`/weddings/${weddingId}/shopping-items/${itemId}`, { method: 'DELETE' }),
};
