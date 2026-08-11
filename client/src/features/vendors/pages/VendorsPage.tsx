import { PencilIcon, PlusIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCategoryDialog } from '@/features/budget/components/AddCategoryDialog';
import { BudgetProgress } from '@/features/budget/components/BudgetProgress';
import { EditCategoryDialog } from '@/features/budget/components/EditCategoryDialog';
import { VendorPaymentTimeline } from '@/features/budget/components/VendorPaymentTimeline';
import { VendorPipelineChart } from '@/features/budget/components/VendorPipelineChart';
import { useBudgetSummary } from '@/features/budget/hooks';
import { useWedding } from '@/features/weddings/hooks';
import { DEMO_MODE } from '@/lib/demo';
import { formatMoney } from '@/lib/format';
import { AddVendorDialog } from '../components/AddVendorDialog';
import { usePaymentsTimeline, useVendorPaymentSummary, useVendors } from '../hooks';

export default function VendorsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: summary, isPending, isError, error } = useBudgetSummary(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const { data: paymentsTimeline } = usePaymentsTimeline(weddingId!);
  const { data: paymentSummary } = useVendorPaymentSummary(weddingId!);

  // Committed-vs-paid rollup, not a sum of the timeline's payment rows —
  // a contract's total is the source of truth for what's owed even for
  // vendors whose remaining installments aren't all itemized yet.
  const totalPaid = (paymentSummary ?? []).reduce((sum, row) => sum + Number(row.paidAmount), 0);
  const totalRemaining = (paymentSummary ?? []).reduce((sum, row) => {
    const committed = Number(row.committedAmount);
    const paid = Math.min(Number(row.paidAmount), committed);
    return sum + Math.max(committed - paid, 0);
  }, 0);

  const vendorNameById = new Map((vendors ?? []).map((v) => [v.id, v.name]));
  const vendorTotals = new Map(
    (paymentSummary ?? [])
      .map((row) => {
        const name = vendorNameById.get(row.vendorId);
        if (!name) return null;
        return [name, { committed: Number(row.committedAmount), paid: Number(row.paidAmount) }] as const;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
  );

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
  const showUncategorized =
    Number(summary.uncategorized.committedAmount) > 0 || Number(summary.uncategorized.paidAmount) > 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-widest text-foreground/70">
        {weddingData.wedding.name}
      </p>
      <h1 className="font-display mt-2 text-4xl font-medium tracking-tight">Vendors</h1>
      <p className="mt-2 text-foreground/70">
        Every vendor you've considered, booked, or passed on — in one place.
      </p>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Vendors</h2>
        <AddVendorDialog
          weddingId={weddingId!}
          budgetCategories={summary.categories}
          trigger={
            <Button size="sm" variant="outline" disabled={DEMO_MODE} title={DEMO_MODE ? 'Read-only demo' : undefined}>
              <PlusIcon /> Add vendor
            </Button>
          }
        />
      </div>

      {!vendors || vendors.length === 0 ? (
        <Card className="mt-4 border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No vendors yet — add one as soon as you start shopping, even before you're sure.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Booked vs. declined</CardTitle>
              <CardDescription>Every vendor considered, by category and outcome.</CardDescription>
            </CardHeader>
            <CardContent>
              <VendorPipelineChart vendors={vendors} />
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Payment timeline</CardTitle>
              <CardDescription>Every vendor payment, plotted chronologically — your wedding cash flow at a glance.</CardDescription>
            </CardHeader>
            <CardContent>
              <VendorPaymentTimeline
                payments={paymentsTimeline ?? []}
                currency={currency}
                totalPaid={totalPaid}
                totalRemaining={totalRemaining}
                vendorTotals={vendorTotals}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-14 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium">Budget categories</h2>
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
    </div>
  );
}
