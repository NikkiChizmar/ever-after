import { CalendarIcon, PencilIcon, Trash2Icon, UserIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DEMO_MODE } from '@/lib/demo';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskStatusSelect } from './TaskStatusSelect';
import type { Task } from '../api';
import type { Vendor } from '@/features/vendors/api';

const TODAY = new Date().toISOString().slice(0, 10);

interface TaskCardProps {
  weddingId: string;
  task: Task;
  vendors: Vendor[];
  vendorName?: string;
  assignee?: string;
  onDelete: () => void;
}

/**
 * One task, one "achievement-style" card — rounded, softly shadowed, lifts
 * on hover — instead of a row in a long list. Matches the visual language
 * introduced for the Achievements section: icon-chip accent, bold status
 * pill, generous spacing.
 */
export function TaskCard({ weddingId, task, vendors, vendorName, assignee, onDelete }: TaskCardProps) {
  const overdue = task.dueDate && task.dueDate < TODAY && task.status !== 'done';
  const isDone = task.status === 'done';

  return (
    <div
      className={cn(
        'mini-card group flex flex-col gap-3 p-4 animate-in fade-in-0 slide-in-from-top-1 duration-300',
        isDone && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-sm font-semibold leading-snug text-card-foreground',
            isDone && 'text-foreground/60 line-through',
          )}
        >
          {task.title}
        </p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <EditTaskDialog
            weddingId={weddingId}
            vendors={vendors}
            task={task}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground size-7 hover:text-primary"
                disabled={DEMO_MODE}
                title={DEMO_MODE ? 'Read-only demo' : 'Edit task'}
              >
                <PencilIcon className="size-3.5" />
                <span className="sr-only">Edit {task.title}</span>
              </Button>
            }
          />
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground size-7 hover:text-destructive"
            onClick={onDelete}
            disabled={DEMO_MODE}
            title={DEMO_MODE ? 'Read-only demo' : undefined}
          >
            <Trash2Icon className="size-3.5" />
            <span className="sr-only">Delete {task.title}</span>
          </Button>
        </div>
      </div>

      {(task.dueDate || assignee || vendorName) && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {task.dueDate && (
            <p className={cn('flex items-center gap-1.5', overdue && 'font-medium text-destructive')}>
              <CalendarIcon className="size-3.5 shrink-0" />
              Due {formatDate(task.dueDate)}
            </p>
          )}
          {(assignee || vendorName) && (
            <p className="flex items-center gap-1.5">
              <UserIcon className="size-3.5 shrink-0" />
              {[assignee, vendorName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-1">
        <TaskStatusSelect weddingId={weddingId} taskId={task.id} status={task.status} />
      </div>
    </div>
  );
}
