import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Two-segment bar: a solid fill for what's actually paid, a lighter fill for
 * what's committed but unpaid, against a track sized to the planned amount.
 * One glance answers three questions (planned / committed / paid) that a
 * plain percentage bar can't — the whole point of the Budget Center.
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
  const overBudget = committed > planned && planned > 0;

  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="relative h-full w-full">
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              overBudget ? 'bg-destructive/30' : 'bg-primary/30',
            )}
            style={{ width: `${committedPct}%` }}
          />
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              overBudget ? 'bg-destructive' : 'bg-primary',
            )}
            style={{ width: `${paidPct}%` }}
          />
        </div>
      </div>
      {overBudget && (
        <p className="mt-1.5 text-xs text-destructive">
          {formatMoney(String(committed - planned), currency)} over planned
        </p>
      )}
    </div>
  );
}
