import { api } from '@/lib/api';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null; // YYYY-MM-DD
  assigneeMemberId: string | null;
  assigneeLabel: string | null;
  vendorId: string | null;
  category: string | null;
  // Free-text sub-area within a category — "Reception tables," "Cookie
  // table," "Guest book table." Not tied to any fixed list, since the
  // areas are invented per-wedding.
  section: string | null;
  createdAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeMemberId?: string | null;
  assigneeLabel?: string | null;
  vendorId?: string | null;
  category?: string;
  section?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeMemberId?: string | null;
  assigneeLabel?: string | null;
  vendorId?: string | null;
  category?: string | null;
  section?: string | null;
}

export const taskApi = {
  list: (weddingId: string) => api<{ tasks: Task[] }>(`/weddings/${weddingId}/tasks`),
  create: (weddingId: string, input: CreateTaskInput) =>
    api<{ task: Task }>(`/weddings/${weddingId}/tasks`, { method: 'POST', body: input }),
  update: (weddingId: string, taskId: string, input: UpdateTaskInput) =>
    api<{ task: Task }>(`/weddings/${weddingId}/tasks/${taskId}`, { method: 'PATCH', body: input }),
  remove: (weddingId: string, taskId: string) =>
    api<void>(`/weddings/${weddingId}/tasks/${taskId}`, { method: 'DELETE' }),
};
