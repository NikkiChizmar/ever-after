import { ChevronDownIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

// How long a task lingers in its old group (mid-crossfade) after its status
// crosses the done / not-done boundary — must match the animation durations
// below so the row disappears right as its slide-out finishes.
const EXIT_ANIMATION_MS = 300;

export default function AwaitingTasksPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: tasks, isPending, isError, error } = useTasks(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: members } = useMembers(weddingId!);
  const deleteTask = useDeleteTask(weddingId!);
  const [showCompleted, setShowCompleted] = useState(false);

  // Tracks tasks that just crossed the done / not-done boundary, so we can
  // keep them rendered in their old spot for a beat and play a slide-out
  // while they simultaneously slide in at their new spot — instead of the
  // row just teleporting between the category group and "completed".
  const [pendingExit, setPendingExit] = useState<Record<string, 'toDone' | 'toAwaiting'>>({});
  const prevStatuses = useRef<Map<string, Task['status']>>(new Map());

  useEffect(() => {
    if (!tasks) return;
    const crossed: [string, 'toDone' | 'toAwaiting'][] = [];
    for (const task of tasks) {
      const prev = prevStatuses.current.get(task.id);
      if (prev !== undefined && prev !== task.status) {
        const wasDone = prev === 'done';
        const isDone = task.status === 'done';
        if (wasDone !== isDone) crossed.push([task.id, isDone ? 'toDone' : 'toAwaiting']);
      }
      prevStatuses.current.set(task.id, task.status);
    }
    if (crossed.length === 0) return;

    setPendingExit((current) => {
      const next = { ...current };
      crossed.forEach(([id, direction]) => { next[id] = direction; });
      return next;
    });
    const timer = setTimeout(() => {
      setPendingExit((current) => {
        const next = { ...current };
        crossed.forEach(([id]) => { delete next[id]; });
        return next;
      });
    }, EXIT_ANIMATION_MS);
    return () => clearTimeout(timer);
  }, [tasks]);

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

  // A task stays visible in its old list for a moment mid-transition
  // (pendingExit), and is already visible in its new list as soon as the
  // status change lands — the two overlap briefly for a crossfade/slide.
  const awaiting = tasks.filter((t) => t.status !== 'done' || pendingExit[t.id] === 'toDone');
  const completed = tasks.filter((t) => t.status === 'done' || pendingExit[t.id] === 'toAwaiting');
  const vendorName = (vendorId: string | null) => vendors?.find((v) => v.id === vendorId)?.name;
  const memberName = (memberId: string | null) => members?.find((m) => m.id === memberId)?.fullName;

  function renderTask(task: Task, listKind: 'awaiting' | 'completed') {
    const assignee = task.assigneeLabel ?? memberName(task.assigneeMemberId);
    const overdue = task.dueDate && task.dueDate < TODAY && task.status !== 'done';
    const exiting =
      (listKind === 'awaiting' && pendingExit[task.id] === 'toDone') ||
      (listKind === 'completed' && pendingExit[task.id] === 'toAwaiting');
    const animationClass = exiting
      ? listKind === 'awaiting'
        ? 'animate-out fade-out-0 slide-out-to-right-3 duration-300'
        : 'animate-out fade-out-0 slide-out-to-left-3 duration-300'
      : 'animate-in fade-in-0 slide-in-from-top-1 duration-300';
    return (
      <div
        key={task.id}
        className={cn('flex items-center justify-between gap-4 px-5 py-4', animationClass)}
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

      {awaiting.length === 0 ? (
        <Card className="mt-4 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {tasks.length === 0
              ? 'No tasks yet — add one whenever something needs doing.'
              : 'Nothing awaiting — everything on the list is done.'}
          </CardContent>
        </Card>
      ) : (
        GROUP_ORDER.map((category) => {
          const group = awaiting.filter((t) => t.category === category);
          if (group.length === 0) return null;
          return (
            <div key={category ?? 'general'} className="mt-6 first:mt-4">
              <h3 className="text-sm font-medium text-foreground/70">{groupLabel(category)}</h3>
              <div className="mt-2 divide-y overflow-hidden rounded-xl border bg-card text-card-foreground">
                {group.map((task) => renderTask(task, 'awaiting'))}
              </div>
            </div>
          );
        })
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
            <div className="mt-3 divide-y overflow-hidden rounded-xl border bg-card text-card-foreground">
              {completed.map((task) => renderTask(task, 'completed'))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
