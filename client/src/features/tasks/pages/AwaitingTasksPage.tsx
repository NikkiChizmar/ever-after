import { ChevronDownIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
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
import { useDeleteTask, useTasks } from '../hooks';
import type { Task } from '../api';

const TODAY = new Date().toISOString().slice(0, 10);

export default function AwaitingTasksPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: tasks, isPending, isError, error } = useTasks(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: members } = useMembers(weddingId!);
  const deleteTask = useDeleteTask(weddingId!);
  const [showCompleted, setShowCompleted] = useState(false);

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

  const awaiting = tasks.filter((t) => t.status !== 'done');
  const completed = tasks.filter((t) => t.status === 'done');
  const vendorName = (vendorId: string | null) => vendors?.find((v) => v.id === vendorId)?.name;
  const memberName = (memberId: string | null) => members?.find((m) => m.id === memberId)?.fullName;

  function renderTask(task: Task) {
    const assignee = task.assigneeLabel ?? memberName(task.assigneeMemberId);
    const overdue = task.dueDate && task.dueDate < TODAY && task.status !== 'done';
    return (
      <div key={task.id} className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p className="text-sm font-medium">{task.title}</p>
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

      {awaiting.length === 0 ? (
        <Card className="mt-4 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {tasks.length === 0
              ? 'No tasks yet — add one whenever something needs doing.'
              : 'Nothing awaiting — everything on the list is done.'}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 divide-y rounded-xl border bg-card text-card-foreground">
          {awaiting.map(renderTask)}
        </div>
      )}

      {completed.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowCompleted((open) => !open)}
            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
            aria-expanded={showCompleted}
          >
            <ChevronDownIcon className={cn('size-4 transition-transform', showCompleted && 'rotate-180')} />
            {showCompleted ? 'Hide completed' : `Show completed (${completed.length})`}
          </button>

          {showCompleted && (
            <div className="mt-3 divide-y rounded-xl border bg-card text-card-foreground">
              {completed.map(renderTask)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
