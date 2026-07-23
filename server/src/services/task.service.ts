import { query } from '../db/pool.js';
import { HttpError } from '../lib/http-error.js';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  assigneeMemberId: string | null;
  assigneeLabel: string | null;
  vendorId: string | null;
  category: string | null;
  createdAt: string;
}

const TASK_COLUMNS = `
  id, wedding_id AS "weddingId", title, description, status,
  due_date AS "dueDate",
  assignee_member_id AS "assigneeMemberId", assignee_label AS "assigneeLabel",
  vendor_id AS "vendorId", category,
  created_at AS "createdAt"
`;

export async function listTasks(weddingId: string): Promise<Task[]> {
  return query<Task>(
    `SELECT ${TASK_COLUMNS} FROM tasks
      WHERE wedding_id = $1
      ORDER BY (due_date IS NULL), due_date, created_at`,
    [weddingId],
  );
}

interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeMemberId?: string | null;
  assigneeLabel?: string | null;
  vendorId?: string | null;
  category?: string;
}

export async function createTask(weddingId: string, input: CreateTaskInput): Promise<Task> {
  if (input.assigneeMemberId && input.assigneeLabel) {
    throw new HttpError(400, 'A task can be assigned to a member or a label, not both');
  }

  const rows = await query<Task>(
    `INSERT INTO tasks (
       wedding_id, title, description, status, due_date,
       assignee_member_id, assignee_label, vendor_id, category
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${TASK_COLUMNS}`,
    [
      weddingId,
      input.title,
      input.description ?? null,
      input.status ?? 'todo',
      input.dueDate ?? null,
      input.assigneeMemberId ?? null,
      input.assigneeLabel ?? null,
      input.vendorId ?? null,
      input.category ?? null,
    ],
  );
  return rows[0]!;
}

export async function getTask(weddingId: string, taskId: string): Promise<Task> {
  const rows = await query<Task>(
    `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = $1 AND wedding_id = $2`,
    [taskId, weddingId],
  );
  const task = rows[0];
  if (!task) {
    throw new HttpError(404, 'Task not found');
  }
  return task;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeMemberId?: string | null;
  assigneeLabel?: string | null;
  vendorId?: string | null;
  category?: string | null;
}

export async function updateTask(
  weddingId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task> {
  const current = await getTask(weddingId, taskId); // 404s if missing/wrong wedding

  const nextAssigneeMemberId =
    input.assigneeMemberId !== undefined ? input.assigneeMemberId : current.assigneeMemberId;
  const nextAssigneeLabel =
    input.assigneeLabel !== undefined ? input.assigneeLabel : current.assigneeLabel;
  if (nextAssigneeMemberId && nextAssigneeLabel) {
    throw new HttpError(400, 'A task can be assigned to a member or a label, not both');
  }
  // Assigning one clears the other, rather than requiring the caller to
  // explicitly null it out on every reassignment.
  if (input.assigneeMemberId !== undefined && input.assigneeMemberId !== null) {
    input.assigneeLabel = null;
  }
  if (input.assigneeLabel !== undefined && input.assigneeLabel !== null) {
    input.assigneeMemberId = null;
  }

  const columnFor: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    dueDate: 'due_date',
    assigneeMemberId: 'assignee_member_id',
    assigneeLabel: 'assignee_label',
    vendorId: 'vendor_id',
    category: 'category',
  };
  const sets: string[] = [];
  const params: unknown[] = [taskId];

  for (const [field, column] of Object.entries(columnFor)) {
    const value = input[field as keyof UpdateTaskInput];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return current;
  }

  const rows = await query<Task>(
    `UPDATE tasks SET ${sets.join(', ')} WHERE id = $1 RETURNING ${TASK_COLUMNS}`,
    params,
  );
  return rows[0]!;
}

export async function deleteTask(weddingId: string, taskId: string): Promise<void> {
  await getTask(weddingId, taskId);
  await query('DELETE FROM tasks WHERE id = $1', [taskId]);
}
