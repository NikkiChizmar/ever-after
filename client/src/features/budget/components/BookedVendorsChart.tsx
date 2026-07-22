import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { formatMoney } from '@/lib/format';
import { VENDOR_CATEGORY_COLORS, VENDOR_CATEGORY_LABELS } from '@/features/vendors/constants';
import type { Vendor } from '@/features/vendors/api';

interface BookedVendorsChartProps {
  vendors: Vendor[];
  currency: string;
}

const ROW_HEIGHT = 36;

/**
 * Cost comparison across booked vendors — "what am I actually spending on
 * what I've picked," which is the question a flat list answers poorly and
 * a ranked bar chart answers at a glance.
 */
export function BookedVendorsChart({ vendors, currency }: BookedVendorsChartProps) {
  const data = vendors
    .filter((v) => v.status === 'booked' && v.estimatedCost !== null)
    .map((v) => ({
      name: v.name,
      cost: Number(v.estimatedCost),
      category: VENDOR_CATEGORY_LABELS[v.category],
      color: VENDOR_CATEGORY_COLORS[v.category],
    }))
    .sort((a, b) => b.cost - a.cost);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No booked vendors with a cost yet — this fills in as you lock things in.
      </p>
    );
  }

  return (
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
                    {row.category} · {formatMoney(row.cost, currency)}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="cost" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
