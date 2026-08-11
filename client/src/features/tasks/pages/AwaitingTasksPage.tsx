import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVendors } from '@/features/vendors/hooks';
import { useMembers, useWedding } from '@/features/weddings/hooks';
import { DEMO_MODE } from '@/lib/demo';
import { cn } from '@/lib/utils';
import { AddTaskDialog } from '../components/AddTaskDialog';
import { TaskCard } from '../components/TaskCard';
import { TASK_CATEGORIES } from '../constants';
import { useDeleteTask, useTasks } from '../hooks';
import type { Task } from '../api';

// null (no category picked) groups first as "General" — the everyday
// planning tasks ("Mail invitations") that aren't tied to a specific
// event — then each event in TASK_CATEGORIES' order (pre-wedding events,
// then the wedding day itself, then a catch-all).
const GROUP_ORDER: (string | null)[] = [null, ...TASK_CATEGORIES];
const groupLabel = (category: string | null) => category ?? 'General';

// Same responsive grid used for both the awaiting and completed sections
// of every category, so the whole page wraps cards consistently instead
// of running into long vertical lists.
const CARD_GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3';

// Second-level, free-text grouping within a category — "Reception" might
// split into "Reception tables," "Cookie table," "Guest book table."
// Tasks with no section picked stay in one flat grid up top; tasks that
// share a section get pulled into their own labeled sub-group below it,
// sorted alphabetically so the layout doesn't reshuffle as tasks change.
function groupBySection(items: Task[]) {
  const ungrouped: Task[] = [];
  const bySection = new Map<string, Task[]>();
  for (const task of items) {
    if (!task.section) {
      ungrouped.push(task);
      continue;
    }
    const list = bySection.get(task.section) ?? [];
    list.push(task);
    bySection.set(task.section, list);
  }
  const sections = [...bySection.entries()].sort(([a], [b]) => a.localeCompare(b));
  return { ungrouped, sections };
}

export default function AwaitingTasksPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: tasks, isPending, isError, error } = useTasks(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: members } = useMembers(weddingId!);
  const deleteTask = useDeleteTask(weddingId!);
  // Collapsed by default in every category — completed tasks are still
  // there to review, just not eating up space until asked for.
  const [expandedCompleted, setExpandedCompleted] = useState<Set<string>>(new Set());
  const toggleCompleted = (key: string) =>
    setExpandedCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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

  function renderTaskCard(task: Task) {
    return (
      <TaskCard
        key={task.id}
        weddingId={weddingId!}
        task={task}
        vendors={vendors ?? []}
        assignee={task.assigneeLabel ?? memberName(task.assigneeMemberId)}
        vendorName={vendorName(task.vendorId)}
        onDelete={() => deleteTask.mutate(task.id)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
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
        <div className="mt-6 space-y-6">
          {GROUP_ORDER.map((category) => {
            const group = tasks.filter((t) => t.category === category);
            // "General" (no category picked) is a catch-all, not a planned
            // event — an empty one is just noise, and its "Add task" prompt
            // would duplicate the page-level button above. Skip it; the
            // named events (Welcome party, Ceremony, etc.) still show empty.
            if (group.length === 0 && category === null) return null;
            // Completed tasks stay grouped under their own "Completed" label —
            // just nested inside this category's section instead of pulled
            // out into one page-wide list.
            const awaitingInGroup = group.filter((t) => t.status !== 'done');
            const completedInGroup = group.filter((t) => t.status === 'done');
            const { ungrouped: awaitingUngrouped, sections: awaitingSections } =
              groupBySection(awaitingInGroup);
            const groupKey = category ?? 'general';
            const isExpanded = expandedCompleted.has(groupKey);
            return (
              <Card key={groupKey} className="glass-surface-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">{groupLabel(category)}</CardTitle>
                </CardHeader>
                <CardContent>
                  {group.length === 0 ? (
                    <div className="mini-card flex flex-col items-center gap-2 border-dashed py-8 text-center">
                      <p className="text-sm text-muted-foreground">Nothing here yet.</p>
                      <AddTaskDialog
                        weddingId={weddingId!}
                        vendors={vendors ?? []}
                        defaultCategory={category ?? undefined}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={DEMO_MODE}
                            title={DEMO_MODE ? 'Read-only demo' : undefined}
                          >
                            <PlusIcon /> Add task
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <>
                      {awaitingUngrouped.length > 0 && (
                        <div className={cn(CARD_GRID, awaitingSections.length > 0 && 'mb-5')}>
                          {awaitingUngrouped.map(renderTaskCard)}
                        </div>
                      )}
                      {awaitingSections.map(([name, items], index) => (
                        <div key={name} className={cn(index > 0 && 'mt-5')}>
                          <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-primary/50" />
                            {name}
                            <span className="font-normal normal-case text-muted-foreground/70">
                              ({items.length})
                            </span>
                          </h4>
                          <div className={CARD_GRID}>{items.map(renderTaskCard)}</div>
                        </div>
                      ))}
                      {completedInGroup.length > 0 && (
                        <div className={cn(awaitingInGroup.length > 0 && 'mt-5')}>
                          <button
                            type="button"
                            onClick={() => toggleCompleted(groupKey)}
                            aria-expanded={isExpanded}
                            className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60"
                          >
                            <span>
                              Completed <span className="text-muted-foreground/70">({completedInGroup.length})</span>
                            </span>
                            <ChevronDownIcon
                              className={cn('size-3.5 transition-transform', isExpanded && 'rotate-180')}
                            />
                          </button>
                          {isExpanded && (
                            <div className={cn(CARD_GRID, 'mt-3')}>{completedInGroup.map(renderTaskCard)}</div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
