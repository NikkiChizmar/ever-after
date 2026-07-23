/** Amounts arrive from the API as numeric strings (exact, no float drift). */
export function formatMoney(amount: string | number | null, currency: string): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Dates arrive from the API as plain YYYY-MM-DD (no time, no zone) — parsing
 * with `new Date('2026-08-01')` reads that as UTC midnight, which can print
 * as the day before in negative-offset zones. Splitting into local
 * year/month/day components sidesteps that entirely.
 */
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(year!, month! - 1, day!),
  );
}
