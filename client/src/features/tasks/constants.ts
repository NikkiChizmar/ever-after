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

// A controlled vocabulary for the day-of event phase a task belongs to —
// stored in the same free-text `category` column vendors and budget
// categories don't share (see docs/data-model.md §2.14), just offered as a
// fixed list here rather than a free-text field, so the Awaiting Tasks
// page can group by it consistently instead of accumulating near-duplicate
// spellings ("Cocktail Hour" vs "cocktail hour" vs "Cocktails").
export const TASK_CATEGORIES = [
  'Welcome party',
  'Ceremony',
  'Cocktail hour',
  'Reception',
  'Miscellaneous',
] as const;
