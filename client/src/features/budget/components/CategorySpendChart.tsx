import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatMoney } from '@/lib/format';
import type { BudgetSummary } from '../api';

const SLICE_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
];

interface CategorySpendChartProps {
  summary: BudgetSummary;
  currency: string;
}

/**
 * Donut of committed spend by category — the "where is the money actually
 * going" view. Deliberately uses committed, not planned: planned is a goal
 * you set once, committed is a fact from real contracts, and a spend chart
 * should be built from facts.
 */
export function CategorySpendChart({ summary, currency }: CategorySpendChartProps) {
  const slices = summary.categories
    .map((category, index) => ({
      name: category.name,
      value: Number(category.committedAmount),
      color: SLICE_COLORS[index % SLICE_COLORS.length]!,
    }))
    .filter((slice) => slice.value > 0);

  if (Number(summary.uncategorized.committedAmount) > 0) {
    slices.push({
      name: 'Uncategorized',
      value: Number(summary.uncategorized.committedAmount),
      color: 'var(--color-muted-foreground)',
    });
  }

  if (slices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing committed yet — this fills in as vendors get contracts.
      </p>
    );
  }

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const slice = payload[0]!;
                return (
                  <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
                    <p className="font-medium text-card-foreground">{slice.name}</p>
                    <p className="text-muted-foreground">
                      {formatMoney(slice.value as number, currency)}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full space-y-2">
        {slices
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((slice) => (
            <div key={slice.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-card-foreground">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.name}
              </span>
              <span className="text-muted-foreground">
                {formatMoney(slice.value, currency)}
                <span className="ml-1.5 text-xs">
                  ({Math.round((slice.value / total) * 100)}%)
                </span>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
