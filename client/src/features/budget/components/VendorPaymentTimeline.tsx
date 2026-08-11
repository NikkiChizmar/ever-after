import { useState } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PaymentTimelineEntry } from '@/features/vendors/api';

const TODAY = new Date().toISOString().slice(0, 10);

/** Parses a plain YYYY-MM-DD string as a local-midnight Date — same
 * approach as lib/format.ts's formatDate, so day math never drifts a day
 * off in negative-offset time zones. */
function toLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const PX_PER_DAY = 2;
const MIN_TRACK_WIDTH = 640;
const LANE_HEIGHT = 28;
const MARKER_GAP_PX = 34;
const TOP_PAD = 24;
const AXIS_TO_LABELS = 22;
const TOOLTIP_ZONE = 168;

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
  x: number;
  lane: number;
  remainingAfter: number;
}

/**
 * One chronological cash-flow line across every vendor — instead of
 * reading vendor by vendor, this answers "what's coming due, and when,
 * across the whole wedding." Every payment (paid or scheduled) is a dot
 * positioned by date on a horizontal axis; dots that fall close together
 * stack into their own lane so they stay clickable instead of merging
 * into a blob. Hover or click a dot for the full picture — vendor,
 * amount, date, status, and what's left on that vendor's contract after
 * this installment.
 */
export function VendorPaymentTimeline({
  payments,
  currency,
  totalPaid,
  totalRemaining,
  vendorTotals,
}: VendorPaymentTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

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

  // Date scale: span from the earliest entry to the latest, stretched to
  // include today so the "Today" marker always lands inside the track.
  const today = toLocalDate(TODAY);
  let minDate = toLocalDate(dated[0]!.effectiveDate);
  let maxDate = toLocalDate(dated[dated.length - 1]!.effectiveDate);
  if (today < minDate) minDate = today;
  if (today > maxDate) maxDate = today;
  const totalDays = Math.max(Math.round((maxDate.getTime() - minDate.getTime()) / DAY_MS), 1);
  const trackWidth = Math.max(totalDays * PX_PER_DAY, MIN_TRACK_WIDTH);
  const pxPerDay = trackWidth / totalDays;
  const xForDate = (date: string) => ((toLocalDate(date).getTime() - minDate.getTime()) / DAY_MS) * pxPerDay;

  // Lane assignment: walk the chronologically-sorted entries and give each
  // one the lowest lane whose last-used x is far enough away — keeps
  // clustered dates from overlapping without needing to measure the DOM.
  const laneLastX: number[] = [];
  const entries: TimelineEntry[] = dated.map((p) => {
    const isPaid = p.paidDate !== null;
    const isOverdue = !isPaid && p.dueDate !== null && p.dueDate < TODAY;
    const x = xForDate(p.effectiveDate);
    let lane = 0;
    while (laneLastX[lane] !== undefined && x - laneLastX[lane]! < MARKER_GAP_PX) lane++;
    laneLastX[lane] = x;
    return {
      ...p,
      isPaid,
      isOverdue,
      x,
      lane,
      remainingAfter: remainingAfterById.get(p.id) ?? 0,
    };
  });

  const maxLane = Math.max(...entries.map((e) => e.lane));
  const axisY = TOP_PAD + maxLane * LANE_HEIGHT;
  const tooltipAnchorY = axisY + AXIS_TO_LABELS + 18;
  const trackHeight = tooltipAnchorY + TOOLTIP_ZONE;
  const todayX = xForDate(TODAY);

  // Month tick marks along the axis, thinned out so labels never collide —
  // greedily keep a tick only once we're at least 64px past the last kept one.
  const monthTicks: { x: number; label: string }[] = [];
  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  let lastKeptX = -Infinity;
  while (cursor <= maxDate) {
    const x = ((cursor.getTime() - minDate.getTime()) / DAY_MS) * pxPerDay;
    if (x - lastKeptX >= 64) {
      monthTicks.push({
        x,
        label: new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' }).format(cursor),
      });
      lastKeptX = x;
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const nextPayment = entries.find((e) => !e.isPaid);

  return (
    <div>
      {/* Summary bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="chart-well rounded-lg p-4">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Paid so far</p>
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
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Remaining</p>
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

      {/* Per-vendor breakdown — the old layout, tucked behind "Remaining" for
          when you want to see one vendor's schedule in isolation instead of
          reading it off the shared timeline. */}
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

      {/* Timeline */}
      <div className="chart-well mt-4 overflow-x-auto rounded-lg p-4">
        <div className="relative" style={{ width: trackWidth, height: trackHeight, minWidth: '100%' }}>
          {/* axis line */}
          <div
            aria-hidden="true"
            className="absolute left-0 h-px bg-border"
            style={{ top: axisY, width: trackWidth }}
          />

          {/* today marker */}
          <div
            aria-hidden="true"
            className="absolute top-0 w-px border-l border-dashed border-primary/50"
            style={{ left: todayX, height: axisY }}
          />
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap text-[10px] font-medium uppercase tracking-widest text-primary"
            style={{ left: todayX, top: 0 }}
          >
            Today
          </span>

          {/* month ticks */}
          {monthTicks.map((tick) => (
            <div key={tick.label + tick.x} className="absolute" style={{ left: tick.x, top: axisY }}>
              <div className="h-1.5 w-px bg-border" />
              <span className="absolute top-2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted-foreground">
                {tick.label}
              </span>
            </div>
          ))}

          {/* payment markers */}
          {entries.map((entry) => {
            const markerY = axisY - entry.lane * LANE_HEIGHT;
            const isActive = activeId === entry.id;
            // Clamp so the tooltip never runs off the left/right edge of the track.
            const tooltipX = Math.min(Math.max(entry.x, 116), trackWidth - 116);

            return (
              <div key={entry.id}>
                {entry.lane > 0 && (
                  <div
                    aria-hidden="true"
                    className="absolute w-px bg-border"
                    style={{ left: entry.x, top: markerY, height: entry.lane * LANE_HEIGHT }}
                  />
                )}
                <button
                  type="button"
                  className={cn(
                    'absolute z-10 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-card transition-transform',
                    entry.isPaid && 'border-primary bg-primary',
                    entry.isOverdue && 'border-destructive',
                    isActive && 'scale-125',
                  )}
                  style={{ left: entry.x, top: markerY }}
                  onMouseEnter={() => setActiveId(entry.id)}
                  onMouseLeave={() => setActiveId((prev) => (prev === entry.id ? null : prev))}
                  onClick={() => setActiveId((prev) => (prev === entry.id ? null : entry.id))}
                  aria-label={`${entry.vendorName}: ${entry.label}, ${formatMoney(entry.amount, currency)}, ${
                    entry.isPaid ? 'paid' : 'upcoming'
                  }`}
                >
                  {entry.isPaid && <CheckIcon className="size-2.5 text-primary-foreground" />}
                </button>

                {isActive && (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute w-px border-l border-dashed border-border"
                      style={{ left: entry.x, top: axisY, height: tooltipAnchorY - axisY }}
                    />
                    <div
                      className="chart-tooltip absolute z-20 w-56 -translate-x-1/2"
                      style={{ left: tooltipX, top: tooltipAnchorY }}
                    >
                      <p className="font-medium text-card-foreground">{entry.vendorName}</p>
                      <p className="text-muted-foreground">{entry.label}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            {entry.isPaid ? 'Paid' : entry.isOverdue ? 'Overdue since' : 'Due'}
                          </span>
                          <span
                            className={cn('font-medium text-card-foreground', entry.isOverdue && 'text-destructive')}
                          >
                            {formatDate(entry.effectiveDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium text-card-foreground">
                            {formatMoney(entry.amount, currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Balance after</span>
                          <span className="font-medium text-card-foreground">
                            {formatMoney(entry.remainingAfter, currency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">Status</span>
                          <span
                            className={cn(
                              'font-medium',
                              entry.isPaid ? 'text-primary' : entry.isOverdue ? 'text-destructive' : 'text-card-foreground',
                            )}
                          >
                            {entry.isPaid ? 'Paid' : entry.isOverdue ? 'Upcoming (overdue)' : 'Upcoming'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
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
        <span className="hidden sm:inline">Hover or tap a marker for details · scroll to see the full timeline</span>
      </div>
    </div>
  );
}
