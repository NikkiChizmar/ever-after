import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Two-segment bar: a solid fill for what's actually paid, a lighter fill for
 * what's committed but unpaid, against a track sized to the planned amount.
 * One glance answers three questions (planned / committed / paid) that a
 * plain percentage bar can't — the whole point of the Budget Center.
 *
 * The two segments are laid out as adjacent (non-overlapping) elements
 * rather than stacked absolute divs, so each one is its own hoverable
 * target — hovering the paid segment shows what's been paid, hovering the
 * lighter committed-but-unpaid segment shows the remaining balance.
 */
export function BudgetProgress({
  planned,
  committed,
  paid,
  currency,
}: {
  planned: number;
  committed: number;
  paid: number;
  currency: string;
}) {
  const scale = Math.max(planned, committed, 1); // avoid divide-by-zero; let overage extend the scale
  const paidPct = Math.min((paid / scale) * 100, 100);
  const committedPct = Math.min((committed / scale) * 100, 100);
  const unpaidPct = Math.max(committedPct - paidPct, 0);
  const remaining = Math.max(committed - paid, 0);
  const overBudget = committed > planned && planned > 0;

  return (
    <div>
      <div className="flex h-2 w-full overflow-visible rounded-full bg-muted">
        {paidPct > 0 && (
          <div
            className={cn(
              'group relative h-full rounded-l-full',
              unpaidPct === 0 && 'rounded-r-full',
              overBudget ? 'bg-destructive' : 'bg-primary',
            )}
            style={{ width: `${paidPct}%` }}
          >
            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {formatMoney(paid, currency)} paid
            </div>
          </div>
        )}
        {unpaidPct > 0 && (
          <div
            className={cn(
              'group relative h-full rounded-r-full',
              paidPct === 0 && 'rounded-l-full',
              overBudget ? 'bg-destructive/30' : 'bg-primary/30',
            )}
            style={{ width: `${unpaidPct}%` }}
          >
            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-card px-3 py-2 text-sm text-card-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {formatMoney(remaining, currency)} left to pay
            </div>
          </div>
        )}
      </div>
      {overBudget && (
        <p className="mt-1.5 text-xs text-destructive">
          {formatMoney(String(committed - planned), currency)} over planned
        </p>
      )}
    </div>
  );
}
