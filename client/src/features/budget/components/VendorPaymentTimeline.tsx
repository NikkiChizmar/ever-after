import { CheckIcon } from 'lucide-react';

import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PaymentTimelineEntry } from '@/features/vendors/api';

const TODAY = new Date().toISOString().slice(0, 10);

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

/**
 * Every vendor gets its own block, so the payment story reads vendor by
 * vendor instead of one flat line where entries from different vendors
 * blur together. Within a block, that vendor's own payments (paid, then
 * scheduled) still run top to bottom on a short connecting line. Blocks
 * are ordered by each vendor's earliest payment date, matching the order
 * payments arrive in from the API.
 */
export function VendorPaymentTimeline({
  payments,
  currency,
  totalPaid,
  totalRemaining,
  vendorTotals,
}: VendorPaymentTimelineProps) {
  const entries = payments
    .map((p) => ({ ...p, effectiveDate: p.paidDate ?? p.dueDate }))
    .filter((p): p is typeof p & { effectiveDate: string } => p.effectiveDate !== null);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payments logged yet — this fills in as contracts and payments get recorded.
      </p>
    );
  }

  const vendorGroups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const group = vendorGroups.get(entry.vendorName);
    if (group) {
      group.push(entry);
    } else {
      vendorGroups.set(entry.vendorName, [entry]);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
      {[...vendorGroups.entries()].map(([vendorName, vendorEntries]) => {
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
          <div key={vendorName} className="chart-well rounded-lg p-4">
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
                    <p className={cn('text-xs text-muted-foreground', isOverdue && 'font-medium text-destructive')}>
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
              <span className="font-medium text-card-foreground">Total {formatMoney(total.committed, currency)}</span>
            </div>
          </div>
        );
      })}
      </div>
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="font-medium text-card-foreground">Paid so far</span>
        <span className="font-display text-base font-medium text-card-foreground">
          {formatMoney(totalPaid, currency)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="font-medium text-card-foreground">Remaining</span>
        <span className="font-display text-base font-medium text-card-foreground">
          {formatMoney(totalRemaining, currency)}
        </span>
      </div>
    </div>
  );
}
