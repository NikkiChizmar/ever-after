import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVendors } from '@/features/vendors/hooks';
import { useMembers, useWedding } from '@/features/weddings/hooks';
import { DEMO_MODE } from '@/lib/demo';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AddTaskDialog } from '../components/AddTaskDialog';
import { TaskStatusSelect } from '../components/TaskStatusSelect';
import { TASK_CATEGORIES } from '../constants';
import { useDeleteTask, useTasks } from '../hooks';
import type { Task } from '../api';

const TODAY = new Date().toISOString().slice(0, 10);

// null (no category picked) groups first as "General" — the everyday
// planning tasks ("Mail invitations") that aren't tied to a specific
// event — then each event in TASK_CATEGORIES' order (pre-wedding events,
// then the wedding day itself, then a catch-all).
const GROUP_ORDER: (string | null)[] = [null, ...TASK_CATEGORIES];
const groupLabel = (category: string | null) => category ?? 'General';

export default function AwaitingTasksPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: tasks, isPending, isError, error } = useTasks(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: members } = useMembers(weddingId!);
  const deleteTask = useDeleteTask(weddingId!);

  if (isPending || !weddingData) {
    return <p className="px-6 py-20 text-center text-sm text-foreground/70">Loading…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="px-6 py-20 text-center text-sm text-destructive">
        {error.message}
      </p>
    );
  }

  const vendorName = (vendorId: string | null) => vendors?.find((v) => v.id === vendorId)?.name;
  const memberName = (memberId: string | null) => members?.find((m) => m.id === memberId)?.fullName;

  function renderTask(task: Task) {
    const assignee = task.assigneeLabel ?? memberName(task.assigneeMemberId);
    const overdue = task.dueDate && task.dueDate < TODAY && task.status !== 'done';
    return (
      <div
        key={task.id}
        className="flex items-center justify-between gap-4 px-5 py-4 animate-in fade-in-0 slide-in-from-top-1 duration-300"
      >
        <div>
          <p className={cn('text-sm font-medium', task.status === 'done' && 'text-foreground/60 line-through')}>
            {task.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {task.dueDate && (
              <span className={cn(overdue && 'font-medium text-destructive')}>
                Due {formatDate(task.dueDate)}
              </span>
            )}
            {assignee && ` · ${assignee}`}
            {vendorName(task.vendorId) && ` · ${vendorName(task.vendorId)}`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <TaskStatusSelect weddingId={weddingId!} taskId={task.id} status={task.status} />
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground size-7 hover:text-destructive"
            onClick={() => deleteTask.mutate(task.id)}
            disabled={DEMO_MODE}
            title={DEMO_MODE ? 'Read-only demo' : undefined}
          >
            <Trash2Icon className="size-3.5" />
            <span className="sr-only">Delete {task.title}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-foreground/70">
        {weddingData.wedding.name}
      </p>
      <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">Awaiting Tasks</h1>
      <p className="mt-2 text-foreground/70">Everything still on the list, in one place.</p>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Tasks</h2>
        <AddTaskDialog weddingId={weddingId!} vendors={vendors ?? []} trigger={
          <Button size="sm" variant="outline" disabled={DEMO_MODE} title={DEMO_MODE ? 'Read-only demo' : undefined}>
            <PlusIcon /> Add task
          </Button>
        } />
      </div>

      {tasks.length === 0 ? (
        <Card className="mt-4 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No tasks yet — add one whenever something needs doing.
          </CardContent>
        </Card>
      ) : (
        GROUP_ORDER.map((category) => {
          const group = tasks.filter((t) => t.category === category);
          if (group.length === 0) return null;
          // Not-done tasks first, completed ones directly underneath in the
          // same section — a task's category is where it lives, whether
          // it's still open or already checked off.
          const ordered = [...group].sort((a, b) => {
            const aDone = a.status === 'done' ? 1 : 0;
            const bDone = b.status === 'done' ? 1 : 0;
            return aDone - bDone;
          });
          return (
            <div key={category ?? 'general'} className="mt-6 first:mt-4">
              <h3 className="text-sm font-medium text-foreground/70">{groupLabel(category)}</h3>
              <div className="mt-2 divide-y overflow-hidden rounded-xl border bg-card text-card-foreground">
                {ordered.map(renderTask)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
