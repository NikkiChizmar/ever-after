import { useState } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PaymentTimelineEntry } from '@/features/vendors/api';

const TODAY = new Date().toISOString().slice(0, 10);
const TODAY_MONTH_KEY = TODAY.slice(0, 7);

/** Parses a plain YYYY-MM-DD string as a local-midnight Date — same
 * approach as lib/format.ts's formatDate, so day math never drifts a day
 * off in negative-offset time zones. */
function toLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

const monthKeyOf = (date: string) => date.slice(0, 7);

interface VendorTotal {
  committed: number;
  paid: number;
}

interface VendorPaymentTimelineProps {
  payments: PaymentTimelineEntry[];
  currency: string;
  /**
   * Totals across every vendor, and per vendor, from the committed-vs-paid
   * rollup (not summed from `payments` here) — a vendor's contract total is
   * the source of truth for what's owed even if every future installment
   * hasn't been itemized into its own payment row yet. Summing only the
   * logged payment rows would understate the total for any vendor whose
   * schedule isn't fully broken out.
   */
  totalPaid: number;
  totalRemaining: number;
  vendorTotals: Map<string, VendorTotal>;
}

interface TimelineEntry extends PaymentTimelineEntry {
  effectiveDate: string;
  isPaid: boolean;
  isOverdue: boolean;
  remainingAfter: number;
}

interface MonthBucket {
  key: string;
  year: number;
  label: string;
  entries: TimelineEntry[];
}

/**
 * A month-by-month overview of every vendor payment — paid and scheduled
 * together, across the whole wedding. Each month is a compact chip (a dot
 * and count if anything's due that month); click one to drop down the
 * full list for that month underneath the grid. No horizontal scrolling
 * required to see the shape of what's coming.
 */
export function VendorPaymentTimeline({
  payments,
  currency,
  totalPaid,
  totalRemaining,
  vendorTotals,
}: VendorPaymentTimelineProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  // undefined = "no explicit choice yet, use the default month";
  // null = "explicitly collapsed"; string = "this month, explicitly".
  const [manualMonthKey, setManualMonthKey] = useState<string | null | undefined>(undefined);

  const dated = payments
    .map((p) => ({ ...p, effectiveDate: p.paidDate ?? p.dueDate }))
    .filter((p): p is typeof p & { effectiveDate: string } => p.effectiveDate !== null)
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate) || a.id.localeCompare(b.id));

  if (dated.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payments logged yet — this fills in as contracts and payments get recorded.
      </p>
    );
  }

  // Running balance per vendor: each entry's "remaining after" is that
  // vendor's contract total minus every payment up to and including this
  // one, in date order — a schedule projection, not just "total minus
  // this one payment," so it reads correctly even out of paid/unpaid order.
  const remainingAfterById = new Map<string, number>();
  const byVendor = new Map<string, typeof dated>();
  for (const entry of dated) {
    const group = byVendor.get(entry.vendorName);
    if (group) group.push(entry);
    else byVendor.set(entry.vendorName, [entry]);
  }
  for (const [vendorName, vendorEntries] of byVendor) {
    const fallbackTotal = vendorEntries.reduce((sum, e) => sum + Number(e.amount), 0);
    const committed = vendorTotals.get(vendorName)?.committed ?? fallbackTotal;
    let cumulative = 0;
    for (const entry of vendorEntries) {
      cumulative += Number(entry.amount);
      remainingAfterById.set(entry.id, Math.max(committed - cumulative, 0));
    }
  }

  const entries: TimelineEntry[] = dated.map((p) => {
    const isPaid = p.paidDate !== null;
    const isOverdue = !isPaid && p.dueDate !== null && p.dueDate < TODAY;
    return { ...p, isPaid, isOverdue, remainingAfter: remainingAfterById.get(p.id) ?? 0 };
  });

  // Every month from the earliest payment to the latest, including today's
  // month, so the grid always covers "where am I now" — empty months are
  // kept (as faded, non-interactive chips) to preserve the sense of a
  // continuous timeline rather than jumping between active months.
  const today = toLocalDate(TODAY);
  let minDate = toLocalDate(dated[0]!.effectiveDate);
  let maxDate = toLocalDate(dated[dated.length - 1]!.effectiveDate);
  if (today < minDate) minDate = today;
  if (today > maxDate) maxDate = today;

  const entriesByMonth = new Map<string, TimelineEntry[]>();
  for (const entry of entries) {
    const key = monthKeyOf(entry.effectiveDate);
    const group = entriesByMonth.get(key);
    if (group) group.push(entry);
    else entriesByMonth.set(key, [entry]);
  }

  const months: MonthBucket[] = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    months.push({
      key,
      year: cursor.getFullYear(),
      label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(cursor),
      entries: entriesByMonth.get(key) ?? [],
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const monthsByYear = new Map<number, MonthBucket[]>();
  for (const month of months) {
    const group = monthsByYear.get(month.year);
    if (group) group.push(month);
    else monthsByYear.set(month.year, [month]);
  }

  const nextPayment = entries.find((e) => !e.isPaid);
  const monthsWithPayments = months.filter((m) => m.entries.length > 0);
  const defaultMonthKey = nextPayment
    ? monthKeyOf(nextPayment.effectiveDate)
    : (monthsWithPayments[monthsWithPayments.length - 1]?.key ?? null);
  const effectiveMonthKey = manualMonthKey === undefined ? defaultMonthKey : manualMonthKey;
  const selectedMonth = months.find((m) => m.key === effectiveMonthKey && m.entries.length > 0) ?? null;

  const selectMonth = (key: string) => setManualMonthKey(effectiveMonthKey === key ? null : key);

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="chart-well rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Total paid</p>
          <p className="font-display mt-1 text-2xl font-medium text-card-foreground">
            {formatMoney(totalPaid, currency)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          aria-expanded={showBreakdown}
          className="chart-well rounded-lg p-4 text-left transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Total remaining</p>
            <ChevronDownIcon
              className={cn('size-3.5 text-muted-foreground transition-transform', showBreakdown && 'rotate-180')}
            />
          </div>
          <p className="font-display mt-1 text-2xl font-medium text-card-foreground">
            {formatMoney(totalRemaining, currency)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {showBreakdown ? 'Hide' : 'See'} breakdown by vendor
          </p>
        </button>
        <div className="chart-well rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Next payment</p>
          {nextPayment ? (
            <>
              <p
                className={cn(
                  'font-display mt-1 text-2xl font-medium text-card-foreground',
                  nextPayment.isOverdue && 'text-destructive',
                )}
              >
                {formatMoney(nextPayment.amount, currency)}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {nextPayment.vendorName} · {nextPayment.isOverdue ? 'overdue since' : 'due'}{' '}
                {formatDate(nextPayment.effectiveDate)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Everything's paid off</p>
          )}
        </div>
      </div>

      {/* Per-vendor breakdown — the old layout, tucked behind "Total remaining"
          for when you want to see one vendor's schedule in isolation instead
          of reading it off the month grid. */}
      {showBreakdown && (
        <div className="chart-well mt-4 rounded-lg p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[...byVendor.entries()].map(([vendorName, vendorEntries]) => {
              const fallbackPaid = vendorEntries
                .filter((e) => e.paidDate !== null)
                .reduce((sum, e) => sum + Number(e.amount), 0);
              const fallbackRemaining = vendorEntries
                .filter((e) => e.paidDate === null)
                .reduce((sum, e) => sum + Number(e.amount), 0);
              const total = vendorTotals.get(vendorName) ?? {
                paid: fallbackPaid,
                committed: fallbackPaid + fallbackRemaining,
              };

              return (
                <div key={vendorName} className="rounded-lg border p-4">
                  <p className="mb-3 text-sm font-medium text-card-foreground">{vendorName}</p>
                  {vendorEntries.map((entry, index) => {
                    const isPaid = entry.paidDate !== null;
                    const isOverdue = !isPaid && entry.dueDate !== null && entry.dueDate < TODAY;
                    const isLast = index === vendorEntries.length - 1;

                    return (
                      <div key={entry.id} className={cn('relative flex gap-3', !isLast && 'pb-4')}>
                        {!isLast && (
                          <span
                            aria-hidden="true"
                            className="absolute left-[5px] top-4 bottom-0 w-px bg-border"
                          />
                        )}
                        <span
                          className={cn(
                            'relative z-10 mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                            isPaid && 'border-primary bg-primary',
                            isOverdue && 'border-destructive',
                          )}
                        >
                          {isPaid && <CheckIcon className="size-2 text-primary-foreground" />}
                        </span>
                        <div className="flex-1 pb-0.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-card-foreground">{entry.label}</p>
                            <span className="font-display text-sm font-medium text-card-foreground">
                              {formatMoney(entry.amount, currency)}
                            </span>
                          </div>
                          <p
                            className={cn(
                              'text-xs text-muted-foreground',
                              isOverdue && 'font-medium text-destructive',
                            )}
                          >
                            {isPaid
                              ? `Paid ${formatDate(entry.effectiveDate)}`
                              : isOverdue
                                ? `Overdue since ${formatDate(entry.effectiveDate)}`
                                : `Due ${formatDate(entry.effectiveDate)}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-muted-foreground">{formatMoney(total.paid, currency)} paid</span>
                    <span className="font-medium text-card-foreground">
                      Total {formatMoney(total.committed, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month grid */}
      <div className="chart-well mt-4 rounded-lg p-4">
        {[...monthsByYear.entries()].map(([year, yearMonths]) => (
          <div key={year} className="mb-4 last:mb-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">{year}</p>
            <div className="flex flex-wrap gap-2">
              {yearMonths.map((month) => {
                const hasPayments = month.entries.length > 0;
                const hasOverdue = month.entries.some((e) => e.isOverdue);
                const hasUnpaid = month.entries.some((e) => !e.isPaid);
                const isSelected = hasPayments && month.key === effectiveMonthKey;
                const isCurrentMonth = month.key === TODAY_MONTH_KEY;
                const statusColor = hasOverdue ? 'destructive' : hasUnpaid ? 'muted' : 'primary';

                return (
                  <button
                    key={month.key}
                    type="button"
                    disabled={!hasPayments}
                    onClick={() => selectMonth(month.key)}
                    title={
                      hasPayments
                        ? `${month.entries.length} payment${month.entries.length === 1 ? '' : 's'} — ${new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(toLocalDate(`${month.key}-01`))}`
                        : undefined
                    }
                    aria-expanded={isSelected}
                    className={cn(
                      'flex min-w-16 flex-col items-center gap-1 rounded-lg border px-3 py-2 transition-colors',
                      hasPayments ? 'hover:border-primary/40' : 'cursor-default opacity-40',
                      isSelected && 'border-primary bg-primary/5',
                      isCurrentMonth && !isSelected && 'ring-1 ring-primary/40',
                    )}
                  >
                    <span className="text-sm font-medium text-card-foreground">{month.label}</span>
                    {hasPayments ? (
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium',
                          statusColor === 'destructive' && 'text-destructive',
                          statusColor === 'muted' && 'text-muted-foreground',
                          statusColor === 'primary' && 'text-primary',
                        )}
                      >
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            statusColor === 'destructive' && 'bg-destructive',
                            statusColor === 'muted' && 'bg-muted-foreground/60',
                            statusColor === 'primary' && 'bg-primary',
                          )}
                        />
                        {month.entries.length}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Selected month's detail list */}
        {selectedMonth ? (
          <div className="mt-2 border-t pt-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
                toLocalDate(`${selectedMonth.key}-01`),
              )}
            </p>
            <div className="space-y-2">
              {selectedMonth.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                        entry.isPaid && 'border-primary bg-primary',
                        entry.isOverdue && 'border-destructive',
                      )}
                    >
                      {entry.isPaid && <CheckIcon className="size-2.5 text-primary-foreground" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-card-foreground">{entry.vendorName}</p>
                      <p
                        className={cn(
                          'truncate text-xs text-muted-foreground',
                          entry.isOverdue && 'font-medium text-destructive',
                        )}
                      >
                        {entry.label} ·{' '}
                        {entry.isPaid
                          ? `Paid ${formatDate(entry.effectiveDate)}`
                          : entry.isOverdue
                            ? `Overdue since ${formatDate(entry.effectiveDate)}`
                            : `Due ${formatDate(entry.effectiveDate)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-sm font-medium text-card-foreground">
                      {formatMoney(entry.amount, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(entry.remainingAfter, currency)} left after
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 border-t pt-4 text-sm text-muted-foreground">
            Click a month above to see its payments.
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="flex size-3 items-center justify-center rounded-full border-2 border-primary bg-primary">
            <CheckIcon className="size-2 text-primary-foreground" />
          </span>
          Paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-muted-foreground/50 bg-card" />
          Upcoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-destructive bg-card" />
          Overdue
        </span>
      </div>
    </div>
  );
}
