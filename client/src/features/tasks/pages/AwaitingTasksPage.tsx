import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddItemDialog } from '@/features/shopping/components/AddItemDialog';
import { ShoppingItemCard } from '@/features/shopping/components/ShoppingItemCard';
import { useDeleteShoppingItem, useShoppingItems } from '@/features/shopping/hooks';
import { useVendors } from '@/features/vendors/hooks';
import { useMembers, useWedding } from '@/features/weddings/hooks';
import { DEMO_MODE } from '@/lib/demo';
import { cn } from '@/lib/utils';
import { AddTaskDialog } from '../components/AddTaskDialog';
import { TaskCard } from '../components/TaskCard';
import { TASK_CATEGORIES } from '../constants';
import { useDeleteTask, useTasks } from '../hooks';
import type { Task } from '../api';
import type { ShoppingItem } from '@/features/shopping/api';
import type { Vendor } from '@/features/vendors/api';

type View = 'tasks' | 'shopping';

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

// A dashed, same-size-as-a-card tile at the end of a grid — pre-fills
// whatever category/section that grid belongs to, so adding another task
// to "Cookie table" doesn't mean re-picking Reception and typing the
// section name again.
function AddTaskTile({
  weddingId,
  vendors,
  category,
  section,
}: {
  weddingId: string;
  vendors: Vendor[];
  category?: string;
  section?: string;
}) {
  return (
    <AddTaskDialog
      weddingId={weddingId}
      vendors={vendors}
      defaultCategory={category}
      defaultSection={section}
      trigger={
        <button
          type="button"
          disabled={DEMO_MODE}
          title={DEMO_MODE ? 'Read-only demo' : 'Add task'}
          className="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="size-4" />
          <span className="text-xs font-medium">Add task</span>
        </button>
      }
    />
  );
}

// Two-state sliding toggle between the task list and the shopping list.
// Same technique as the top nav's TabNav sliding pill — measure the active
// button's real box and animate left/width to it — rather than guessing a
// 50/50 split with a CSS transform, which never quite lined up.
function ViewToggle({ value, onChange }: { value: View; onChange: (next: View) => void }) {
  const options: { value: View; label: string }[] = [
    { value: 'tasks', label: 'Tasks' },
    { value: 'shopping', label: 'To purchase' },
  ];
  const activeIndex = options.findIndex((option) => option.value === value);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = buttonRefs.current[activeIndex];
      if (el) {
        setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeIndex]);

  return (
    <div className="relative inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-0.5 text-sm">
      {indicator && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0.5 rounded-full bg-card shadow-sm transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      )}
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'relative z-10 rounded-full px-4 py-1.5 font-medium whitespace-nowrap transition-colors',
            value === option.value ? 'text-card-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Same dashed trailing tile as AddTaskTile, for the shopping grid.
function AddItemTile({ weddingId }: { weddingId: string }) {
  return (
    <AddItemDialog
      weddingId={weddingId}
      trigger={
        <button
          type="button"
          disabled={DEMO_MODE}
          title={DEMO_MODE ? 'Read-only demo' : 'Add item'}
          className="flex h-full min-h-[104px] w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="size-4" />
          <span className="text-xs font-medium">Add item</span>
        </button>
      }
    />
  );
}

export default function AwaitingTasksPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: tasks, isPending, isError, error } = useTasks(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: members } = useMembers(weddingId!);
  const deleteTask = useDeleteTask(weddingId!);
  const { data: shoppingItems, isPending: isShoppingPending, isError: isShoppingError, error: shoppingError } =
    useShoppingItems(weddingId!);
  const deleteItem = useDeleteShoppingItem(weddingId!);
  const [view, setView] = useState<View>('tasks');
  // Collapsed by default — purchased items are still there to review, just
  // not eating up space until asked for.
  const [showPurchased, setShowPurchased] = useState(false);
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
  const currency = weddingData.wedding.currency;

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

  function renderItemCard(item: ShoppingItem) {
    return (
      <ShoppingItemCard
        key={item.id}
        weddingId={weddingId!}
        item={item}
        currency={currency}
        onDelete={() => deleteItem.mutate(item.id)}
      />
    );
  }

  const itemsToBuy = (shoppingItems ?? []).filter((item) => !item.purchased);
  const purchasedItems = (shoppingItems ?? []).filter((item) => item.purchased);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-foreground/70">
        {weddingData.wedding.name}
      </p>
      <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">Awaiting Tasks</h1>
      <p className="mt-2 text-foreground/70">Everything still on the list, in one place.</p>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-medium">
            {view === 'tasks' ? 'Tasks' : 'To purchase'}
          </h2>
          <ViewToggle value={view} onChange={setView} />
        </div>
        {view === 'tasks' ? (
          <AddTaskDialog weddingId={weddingId!} vendors={vendors ?? []} trigger={
            <Button size="sm" variant="outline" disabled={DEMO_MODE} title={DEMO_MODE ? 'Read-only demo' : undefined}>
              <PlusIcon /> Add task
            </Button>
          } />
        ) : (
          <AddItemDialog weddingId={weddingId!} trigger={
            <Button size="sm" variant="outline" disabled={DEMO_MODE} title={DEMO_MODE ? 'Read-only demo' : undefined}>
              <PlusIcon /> Add item
            </Button>
          } />
        )}
      </div>

      {view === 'shopping' ? (
        isShoppingPending ? (
          <p className="mt-10 text-center text-sm text-foreground/70">Loading…</p>
        ) : isShoppingError ? (
          <p role="alert" className="mt-10 text-center text-sm text-destructive">
            {shoppingError.message}
          </p>
        ) : (shoppingItems ?? []).length === 0 ? (
          <Card className="mt-4 border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Nothing on the list yet — add anything you still need to buy.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-6">
            <Card className="glass-surface-lg rounded-2xl">
              <CardContent className="pt-6">
                <div className={cn(CARD_GRID, purchasedItems.length > 0 && 'mb-5')}>
                  {itemsToBuy.map(renderItemCard)}
                  <AddItemTile weddingId={weddingId!} />
                </div>
                {purchasedItems.length > 0 && (
                  <div className={cn(itemsToBuy.length > 0 && 'mt-5')}>
                    <button
                      type="button"
                      onClick={() => setShowPurchased((prev) => !prev)}
                      aria-expanded={showPurchased}
                      className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60"
                    >
                      <span>
                        Purchased <span className="text-muted-foreground/70">({purchasedItems.length})</span>
                      </span>
                      <ChevronDownIcon
                        className={cn('size-3.5 transition-transform', showPurchased && 'rotate-180')}
                      />
                    </button>
                    {showPurchased && (
                      <div className={cn(CARD_GRID, 'mt-3')}>{purchasedItems.map(renderItemCard)}</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      ) : tasks.length === 0 ? (
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
                          <AddTaskTile
                            weddingId={weddingId!}
                            vendors={vendors ?? []}
                            category={category ?? undefined}
                          />
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
                          <div className={CARD_GRID}>
                            {items.map(renderTaskCard)}
                            <AddTaskTile
                              weddingId={weddingId!}
                              vendors={vendors ?? []}
                              category={category ?? undefined}
                              section={name}
                            />
                          </div>
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
