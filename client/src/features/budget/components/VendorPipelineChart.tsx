import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import {
  VENDOR_CATEGORY_LABELS,
  VENDOR_STATUS_CHART_COLORS,
  VENDOR_STATUS_LABELS,
  VENDOR_STATUS_ORDER,
} from '@/features/vendors/constants';
import type { Vendor, VendorCategory, VendorStatus } from '@/features/vendors/api';

interface VendorPipelineChartProps {
  vendors: Vendor[];
}

const ROW_HEIGHT = 40;

/**
 * "Which vendors did we book vs. rule out" — one horizontal stacked bar per
 * vendor category, segmented by status. Answers the shape of the whole
 * search (how many venues did we even look at?) as well as the outcome
 * (which one won), which a flat alphabetical list of 47 rows couldn't do
 * without a lot of scrolling and squinting at badges.
 */
export function VendorPipelineChart({ vendors }: VendorPipelineChartProps) {
  const categories = Array.from(new Set(vendors.map((v) => v.category))) as VendorCategory[];

  const data = categories
    .map((category) => {
      const inCategory = vendors.filter((v) => v.category === category);
      const counts = Object.fromEntries(
        VENDOR_STATUS_ORDER.map((status) => [
          status,
          inCategory.filter((v) => v.status === status).length,
        ]),
      ) as Record<VendorStatus, number>;
      return {
        category: VENDOR_CATEGORY_LABELS[category],
        total: inCategory.length,
        ...counts,
      };
    })
    .sort((a, b) => b.total - a.total);

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No vendors yet — add one as soon as you start shopping, even before you're sure.
      </p>
    );
  }

  return (
    <div>
      <div style={{ height: Math.max(data.length * ROW_HEIGHT, 120) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="category"
              width={100}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 13 }}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-accent)' }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const nonZero = payload.filter((entry) => Number(entry.value) > 0);
                return (
                  <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
                    <p className="font-medium text-card-foreground">{label}</p>
                    {nonZero.map((entry) => (
                      <p key={entry.dataKey as string} className="text-muted-foreground">
                        {VENDOR_STATUS_LABELS[entry.dataKey as VendorStatus]}: {entry.value as number}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            {VENDOR_STATUS_ORDER.map((status) => (
              <Bar
                key={status}
                dataKey={status}
                stackId="pipeline"
                fill={VENDOR_STATUS_CHART_COLORS[status]}
                stroke="var(--color-card)"
                strokeWidth={1}
                radius={
                  status === VENDOR_STATUS_ORDER[VENDOR_STATUS_ORDER.length - 1] ? [0, 4, 4, 0] : undefined
                }
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        {VENDOR_STATUS_ORDER.map((status) => (
          <span key={status} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: VENDOR_STATUS_CHART_COLORS[status] }}
            />
            {VENDOR_STATUS_LABELS[status]}
          </span>
        ))}
      </div>
    </div>
  );
}
