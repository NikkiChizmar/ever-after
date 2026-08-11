import { useParams } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CategorySpendChart } from '@/features/budget/components/CategorySpendChart';
import { useBudgetSummary } from '@/features/budget/hooks';
import { useVendorPaymentSummary, useVendors } from '@/features/vendors/hooks';
import { formatMoney } from '@/lib/format';
import { useWedding } from '../hooks';

function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year!, month! - 1, day!);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

const upcomingModules = [
  { title: 'Guests & RSVPs', description: 'Parties, per-event invitations, meals.' },
  { title: 'Tasks', description: 'Everything that must happen, owned by someone.' },
  { title: 'Documents', description: 'Contracts and invoices, safely stored.' },
];

export default function DashboardPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data, isPending, isError, error } = useWedding(weddingId!);
  const { data: summary } = useBudgetSummary(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: paymentSummary } = useVendorPaymentSummary(weddingId!);

  if (isPending) {
    return <p className="px-6 py-20 text-center text-sm text-foreground/70">Loading…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="px-6 py-20 text-center text-sm text-destructive">
        {error.message}
      </p>
    );
  }

  const { wedding, role } = data;
  const countdown = daysUntil(wedding.weddingDate);
  const currency = wedding.currency;
  const money = (amount: string) => formatMoney(amount, currency);

  const remainingToPay = summary
    ? Number(summary.totals.committedAmount) - Number(summary.totals.paidAmount)
    : 0;

  // What Nikki & Cody are personally covering, as opposed to the wedding
  // budget as a whole — currently just these two categories; say the word
  // and more can be added here.
  const OUR_CATEGORIES = ['Videography', 'Live music'];
  const ourCategories = summary?.categories.filter((c) => OUR_CATEGORIES.includes(c.name)) ?? [];
  const ourCategoryIds = new Set(ourCategories.map((c) => c.id));

  // Break the total down per vendor, not just per category — a category can
  // hold several vendors under consideration, but only the ones with a real
  // contract (i.e. an entry in paymentSummary) actually owe anything.
  const ourVendorBalances = (vendors ?? [])
    .filter((v) => v.budgetCategoryId && ourCategoryIds.has(v.budgetCategoryId))
    .map((v) => {
      const payment = paymentSummary?.find((p) => p.vendorId === v.id);
      if (!payment) return null;
      const committed = Number(payment.committedAmount);
      const paid = Number(payment.paidAmount);
      return {
        vendorName: v.name,
        categoryName: summary?.categories.find((c) => c.id === v.budgetCategoryId)?.name ?? '',
        remaining: Math.max(committed - paid, 0),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const ourRemaining = ourVendorBalances.reduce((sum, row) => sum + row.remaining, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-foreground/70">
            {role === 'owner' ? 'Your wedding' : `Shared with you · ${role}`}
          </p>
          <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">{wedding.name}</h1>
        </div>
        {countdown !== null && countdown >= 0 && (
          <p className="text-right">
            <span className="font-display text-3xl font-medium">{countdown}</span>
            <span className="ml-2 text-sm text-foreground/70">days to go</span>
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Date</CardDescription>
            <CardTitle className="font-display text-xl font-medium">
              {wedding.weddingDate ?? 'Not set yet'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Budget</CardDescription>
            <CardTitle className="font-display text-xl font-medium">
              {formatMoney(wedding.totalBudget, wedding.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Your role</CardDescription>
            <CardTitle className="font-display text-xl font-medium capitalize">{role}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {summary && (
        <>
          <h2 className="font-display mt-14 text-lg font-medium">Budget</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader>
                <CardDescription>Planned</CardDescription>
                <CardTitle className="font-display text-xl font-medium">
                  {money(summary.totals.plannedAmount)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Committed</CardDescription>
                <CardTitle className="font-display text-xl font-medium">
                  {money(summary.totals.committedAmount)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Paid</CardDescription>
                <CardTitle className="font-display text-xl font-medium">
                  {money(summary.totals.paidAmount)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Remaining to pay</CardDescription>
                <CardTitle className="font-display text-xl font-medium">
                  {formatMoney(String(remainingToPay), currency)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {ourVendorBalances.length > 0 && (
            <Card className="mt-4 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardDescription>
                  What Nikki & Cody are covering ({ourCategories.map((c) => c.name).join(' + ')})
                </CardDescription>
                <CardTitle className="font-display text-2xl font-medium">
                  {formatMoney(String(ourRemaining), currency)} left to pay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {ourVendorBalances.map((row) => (
                  <div key={row.vendorName} className="flex items-center justify-between text-sm">
                    <span className="text-card-foreground">
                      {row.vendorName} <span className="text-muted-foreground">({row.categoryName})</span>
                    </span>
                    <span className="font-medium text-card-foreground">
                      {formatMoney(String(row.remaining), currency)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {summary.categories.length > 0 && (
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Spend by category</CardTitle>
                  <CardDescription>Committed amounts, from real contracts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategorySpendChart summary={summary} currency={currency} />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <h2 className="font-display mt-14 text-lg font-medium">Modules</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {upcomingModules.map((module) => (
          <Card key={module.title} className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base font-medium text-muted-foreground">
                {module.title}
              </CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/70">
                In development
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
