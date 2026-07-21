import { api } from '@/lib/api';

export interface BudgetCategory {
  id: string;
  weddingId: string;
  name: string;
  plannedAmount: string;
  sortOrder: number;
}

export interface BudgetSummary {
  categories: (BudgetCategory & { committedAmount: string; paidAmount: string })[];
  uncategorized: { committedAmount: string; paidAmount: string };
  totals: { plannedAmount: string; committedAmount: string; paidAmount: string };
}

export interface CreateCategoryInput {
  name: string;
  plannedAmount?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  plannedAmount?: number;
}

export const budgetApi = {
  summary: (weddingId: string) => api<BudgetSummary>(`/weddings/${weddingId}/budget-summary`),
  createCategory: (weddingId: string, input: CreateCategoryInput) =>
    api<{ category: BudgetCategory }>(`/weddings/${weddingId}/budget-categories`, {
      method: 'POST',
      body: input,
    }),
  updateCategory: (weddingId: string, categoryId: string, input: UpdateCategoryInput) =>
    api<{ category: BudgetCategory }>(`/weddings/${weddingId}/budget-categories/${categoryId}`, {
      method: 'PATCH',
      body: input,
    }),
  deleteCategory: (weddingId: string, categoryId: string) =>
    api<void>(`/weddings/${weddingId}/budget-categories/${categoryId}`, { method: 'DELETE' }),
};
