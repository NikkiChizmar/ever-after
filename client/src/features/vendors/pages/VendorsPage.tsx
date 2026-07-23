import { PlusIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookedVendorsChart } from '@/features/budget/components/BookedVendorsChart';
import { VendorPipelineChart } from '@/features/budget/components/VendorPipelineChart';
import { useBudgetSummary } from '@/features/budget/hooks';
import { useWedding } from '@/features/weddings/hooks';
import { AddVendorDialog } from '../components/AddVendorDialog';
import { useVendors } from '../hooks';

export default function VendorsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: summary, isPending, isError, error } = useBudgetSummary(weddingId!);
  const { data: vendors } = useVendors(weddingId!);

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
            <Button size="sm" variant="outline">
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
        </div>
      )}
    </div>
  );
}
