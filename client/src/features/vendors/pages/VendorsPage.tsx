import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookedVendorsChart } from '@/features/budget/components/BookedVendorsChart';
import { VendorPipelineChart } from '@/features/budget/components/VendorPipelineChart';
import { useBudgetSummary } from '@/features/budget/hooks';
import { useWedding } from '@/features/weddings/hooks';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AddVendorDialog } from '../components/AddVendorDialog';
import { VendorStatusSelect } from '../components/VendorStatusSelect';
import { VENDOR_CATEGORY_LABELS } from '../constants';
import { useVendors } from '../hooks';

export default function VendorsPage() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const { data: weddingData } = useWedding(weddingId!);
  const { data: summary, isPending, isError, error } = useBudgetSummary(weddingId!);
  const { data: vendors } = useVendors(weddingId!);
  const [manageListOpen, setManageListOpen] = useState(false);

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
        <>
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

          <button
            type="button"
            onClick={() => setManageListOpen((open) => !open)}
            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground"
            aria-expanded={manageListOpen}
          >
            <ChevronDownIcon className={cn('size-4 transition-transform', manageListOpen && 'rotate-180')} />
            {manageListOpen ? 'Hide vendor list' : 'Manage vendor list'}
          </button>

          {manageListOpen && (
            <div className="mt-3 divide-y rounded-xl border bg-card text-card-foreground">
              {vendors.map((vendor) => {
                const budgetCategory = summary.categories.find((c) => c.id === vendor.budgetCategoryId);
                return (
                  <div key={vendor.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {VENDOR_CATEGORY_LABELS[vendor.category]}
                        {budgetCategory && ` · ${budgetCategory.name}`}
                        {vendor.estimatedCost && ` · est. ${money(vendor.estimatedCost)}`}
                      </p>
                    </div>
                    <VendorStatusSelect weddingId={weddingId!} vendorId={vendor.id} status={vendor.status} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
