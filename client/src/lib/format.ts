/** Amounts arrive from the API as numeric strings (exact, no float drift). */
export function formatMoney(amount: string | number | null, currency: string): string {
  if (amount === null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}
