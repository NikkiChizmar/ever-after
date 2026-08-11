import type { TaskStatus } from './api';

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Complete',
};

// default = not started; warning = in motion; success = wrapped up. Same
// three-tier logic as VENDOR_STATUS_BADGE_VARIANT.
export const TASK_STATUS_BADGE_VARIANT: Record<TaskStatus, 'default' | 'warning' | 'success'> = {
  todo: 'default',
  in_progress: 'warning',
  done: 'success',
};

// Solid icon-chip background per status — bolder and easier to scan at a
// glance than the tinted Badge alone, used on the achievement-style task
// cards (see TaskCard.tsx).
export const TASK_STATUS_ICON_BG: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-accent text-accent-foreground',
  done: 'bg-primary text-primary-foreground',
};

export const TASK_STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];

// A controlled vocabulary for the event a task belongs to — pre-wedding
// events first (in the order they typically happen), then the wedding day
// itself, then a catch-all. Stored in the same free-text `category` column
// vendors and budget categories don't share (see docs/data-model.md
// §2.14), just offered as a fixed list here rather than a free-text field,
// so the Awaiting Tasks page can group by it consistently instead of
// accumulating near-duplicate spellings ("Cocktail Hour" vs "cocktail
// hour" vs "Cocktails").
export const TASK_CATEGORIES = [
  'Bridesmaids proposal',
  'Bachelorette',
  'Bridal shower',
  'Welcome party',
  'Ceremony',
  'Cocktail hour',
  'Reception',
  'Miscellaneous',
] as const;
