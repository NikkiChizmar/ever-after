import type { TaskStatus } from './api';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

// default = not started; warning = in motion; success = wrapped up. Same
// three-tier logic as VENDOR_STATUS_BADGE_VARIANT.
export const TASK_STATUS_BADGE_VARIANT: Record<TaskStatus, 'default' | 'warning' | 'success'> = {
  todo: 'default',
  in_progress: 'warning',
  done: 'success',
};

export const TASK_STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];
