import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatMoney } from '@/lib/format';
import type { Vendor, VendorPaymentSummary } from '@/features/vendors/api';

interface VendorPaymentsChartProps {
  vendors: Vendor[];
  paymentSummary: VendorPaymentSummary[];
  currency: string;
}

const ROW_HEIGHT = 36;

/**
 * "What have I actually paid toward each vendor, and what's left" — stacked
 * per vendor rather than the flat cost bar next to it, since the question
 * here is progress against a contract, not just what something costs.
 * Only vendors with a contract on file show up (no contract, nothing to
 * roll up) — matches how BookedVendorsChart only shows vendors with a cost.
 */
export function VendorPaymentsChart({ vendors, paymentSummary, currency }: VendorPaymentsChartProps) {
  const vendorById = new Map(vendors.map((v) => [v.id, v]));

  const data = paymentSummary
    .map((row) => {
      const vendor = vendorById.get(row.vendorId);
      const committed = Number(row.committedAmount);
      const paid = Math.min(Number(row.paidAmount), committed);
      return {
        name: vendor?.name ?? 'Unknown vendor',
        paid,
        remaining: Math.max(committed - paid, 0),
        committed,
      };
    })
    .filter((row) => row.committed > 0)
    .sort((a, b) => b.committed - a.committed);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contracts on file yet — this fills in once a vendor's contract and payments are recorded.
      </p>
    );
  }

  const totalPaid = data.reduce((sum, row) => sum + row.paid, 0);
  const totalRemaining = data.reduce((sum, row) => sum + row.remaining, 0);

  return (
    <div>
      <div style={{ height: Math.max(data.length * ROW_HEIGHT, 120) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 13 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-accent)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]!.payload as (typeof data)[number];
                return (
                  <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
                    <p className="font-medium text-card-foreground">{row.name}</p>
                    <p className="text-muted-foreground">
                      {formatMoney(row.paid, currency)} paid · {formatMoney(row.remaining, currency)}{' '}
                      left of {formatMoney(row.committed, currency)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="paid"
              stackId="payment"
              fill="var(--color-chart-4)"
              radius={[4, 0, 0, 4]}
              barSize={18}
              stroke="var(--color-card)"
              strokeWidth={1}
            />
            <Bar
              dataKey="remaining"
              stackId="payment"
              fill="var(--color-muted)"
              radius={[0, 4, 4, 0]}
              barSize={18}
              stroke="var(--color-card)"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-chart-4)' }} />
          Paid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: 'var(--color-muted)' }} />
          Remaining
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t pt-3 text-sm">
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
