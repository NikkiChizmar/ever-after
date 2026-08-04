import { PlusIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookedVendorsChart } from '@/features/budget/components/BookedVendorsChart';
import { VendorPaymentTimeline } from '@/features/budget/components/VendorPaymentTimeline';
import { VendorPipelineChart } from '@/features/budget/components/VendorPipelineChart';
import { useBudgetSummary } from '@/features/budget/hooks';
import { useWedding } from '@/features/weddings/hooks';
import { DEMO_MODE } from '@/lib/demo';
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Booked vs. declined</CardTitle>
              <CardDescription>Every vendor considered, by category and outcome.</CardDescription>
            </CardHeader>
            <CardContent>
              <VendorPipelineChart vendors={vendors} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Booked vendor costs</CardTitle>
              <CardDescription>What you've locked in, ranked by cost.</CardDescription>
            </CardHeader>
            <CardContent>
              <BookedVendorsChart vendors={vendors} currency={currency} />
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-medium">Payment timeline</CardTitle>
              <CardDescription>Paid and upcoming payments, broken out by vendor.</CardDescription>
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
    </div>
  );
}
