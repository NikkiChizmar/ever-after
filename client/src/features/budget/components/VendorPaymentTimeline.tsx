import { CheckIcon } from 'lucide-react';

import { formatDate, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PaymentTimelineEntry } from '@/features/vendors/api';

const TODAY = new Date().toISOString().slice(0, 10);

interface VendorPaymentTimelineProps {
  payments: PaymentTimelineEntry[];
  currency: string;
}

/**
 * One continuous chronological line of every payment across every
 * vendor — already-paid entries (sorted by paid_date) flow straight into
 * still-scheduled ones (sorted by due_date), with a "Today" marker where
 * the two meet, so the whole payment story reads top to bottom rather
 * than needing two separate "paid" and "upcoming" lists cross-referenced
 * by eye.
 */
export function VendorPaymentTimeline({ payments, currency }: VendorPaymentTimelineProps) {
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

  const todayIndex = entries.findIndex((e) => e.effectiveDate > TODAY);

  return (
    <div>
      {entries.map((entry, index) => {
        const isPaid = entry.paidDate !== null;
        const isOverdue = !isPaid && entry.dueDate !== null && entry.dueDate < TODAY;
        const isLast = index === entries.length - 1;

        return (
          <div key={entry.id}>
            {index === todayIndex && todayIndex > 0 && (
              <div className="mb-5 flex items-center gap-2 pl-8 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                Today
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            <div className={cn('relative flex gap-4', !isLast && 'pb-5')}>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-[7px] top-4 bottom-0 w-px bg-border"
                />
              )}
              <span
                className={cn(
                  'relative z-10 mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 bg-card',
                  isPaid && 'border-primary bg-primary',
                  isOverdue && 'border-destructive',
                )}
              >
                {isPaid && <CheckIcon className="size-2.5 text-primary-foreground" />}
              </span>
              <div className="flex-1 pb-0.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-card-foreground">
                    {entry.vendorName}{' '}
                    <span className="font-normal text-muted-foreground">· {entry.label}</span>
                  </p>
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
          </div>
        );
      })}
    </div>
  );
}
