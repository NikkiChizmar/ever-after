import { PencilIcon, PlusIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVendorPaymentSummary, useVendors } from '@/features/vendors/hooks';
import { useWedding } from '@/features/weddings/hooks';
import { DEMO_MODE } from '@/lib/demo';
import { formatMoney } from '@/lib/format';
import { AddCategoryDialog } from '../components/AddCategoryDialog';
import { BudgetProgress } from '../components/BudgetProgress';
import { CategorySpendChart } from '../components/CategorySpendChart';
import { EditCategoryDialog } from '../components/EditCategoryDialog';
import { useBudgetSummary } from '../hooks';

export default function BudgetCenterPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: summary, isPending, isError, error } = useBudgetSummary(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: paymentSummary } = useVendorPaymentSummary(weddingId!);

  if (isPending || !weddingData) {
    return <p className="px-6 py-20 text-center text-sm text-foreground/70">Loading…</p>;
  }
  if (isError) {
    return (
      <p role="alert" className="px-6 py-20 text-center text-sm text-destructive">
        {error.message}
      </p>
    );
  }

  const currency = weddingData.wedding.currency;
  const money = (amount: string) => formatMoney(amount, currency);
  const remainingToPay = Number(summary.totals.committedAmount) - Number(summary.totals.paidAmount);
  const showUncategorized =
    Number(summary.uncategorized.committedAmount) > 0 || Number(summary.uncategorized.paidAmount) > 0;

  // What Nikki & Cody are personally covering, as opposed to the wedding
  // budget as a whole — currently just these two categories; say the word
  // and more can be added here.
  const OUR_CATEGORIES = ['Videography', 'Live music'];
  const ourCategories = summary.categories.filter((c) => OUR_CATEGORIES.includes(c.name));
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
        categoryName: summary.categories.find((c) => c.id === v.budgetCategoryId)?.name ?? '',
        remaining: Math.max(committed - paid, 0),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const ourRemaining = ourVendorBalances.reduce((sum, row) => sum + row.remaining, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-foreground/70">
        {weddingData.wedding.name}
      </p>
      <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">Budget Center</h1>
      <p className="mt-2 text-foreground/70">
        Planned, committed, and paid — always in sync, never entered twice.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-4">
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

      <div className="mt-14 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Categories</h2>
        <AddCategoryDialog
          weddingId={weddingId!}
          trigger={
            <Button size="sm" variant="outline" disabled={DEMO_MODE} title={DEMO_MODE ? 'Read-only demo' : undefined}>
              <PlusIcon /> Add category
            </Button>
          }
        />
      </div>

      {summary.categories.length === 0 && !showUncategorized ? (
        <Card className="mt-4 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No categories yet. Start with the big ones — venue, catering, photography.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {summary.categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle className="text-base font-medium">{category.name}</CardTitle>
                <EditCategoryDialog
                  weddingId={weddingId!}
                  category={category}
                  trigger={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 -mt-1 -mr-1"
                      disabled={DEMO_MODE}
                      title={DEMO_MODE ? 'Read-only demo' : undefined}
                    >
                      <PencilIcon className="size-3.5" />
                      <span className="sr-only">Edit {category.name}</span>
                    </Button>
                  }
                />
              </CardHeader>
              <CardContent>
                <BudgetProgress
                  planned={Number(category.plannedAmount)}
                  committed={Number(category.committedAmount)}
                  paid={Number(category.paidAmount)}
                  currency={currency}
                />
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{money(category.paidAmount)} paid</span>
                  <span className="font-medium text-card-foreground">
                    Total {money(category.committedAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}

          {showUncategorized && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Uncategorized
                </CardTitle>
                <CardDescription>Vendors not yet assigned to a category.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{money(summary.uncategorized.committedAmount)} committed</span>
                  <span>{money(summary.uncategorized.paidAmount)} paid</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {summary.categories.length > 0 && (
        <div className="mt-14">
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
    </div>
  );
}
