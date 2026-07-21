import { useState, type FormEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BudgetCategory } from '@/features/budget/api';
import { useCreateVendor } from '../hooks';
import { VENDOR_CATEGORY_LABELS } from '../constants';
import type { VendorCategory } from '../api';

const CATEGORY_OPTIONS = Object.entries(VENDOR_CATEGORY_LABELS) as [VendorCategory, string][];

export function AddVendorDialog({
  weddingId,
  budgetCategories,
  trigger,
}: {
  weddingId: string;
  budgetCategories: BudgetCategory[];
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory | ''>('');
  const [budgetCategoryId, setBudgetCategoryId] = useState<string>('none');
  const [estimatedCost, setEstimatedCost] = useState('');
  const createVendor = useCreateVendor(weddingId);

  function reset() {
    setName('');
    setCategory('');
    setBudgetCategoryId('none');
    setEstimatedCost('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!category) return;
    createVendor.mutate(
      {
        name,
        category,
        budgetCategoryId: budgetCategoryId === 'none' ? undefined : budgetCategoryId,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      },
      { onSuccess: () => { setOpen(false); reset(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New vendor</DialogTitle>
          <DialogDescription>Track it from first inquiry, whether or not you book them.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendorName">Name</Label>
            <Input
              id="vendorName"
              placeholder="Blossom Catering Co."
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendorCategory">Type</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
              <SelectTrigger id="vendorCategory">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetCategory">Budget category (optional)</Label>
            <Select value={budgetCategoryId} onValueChange={setBudgetCategoryId}>
              <SelectTrigger id="budgetCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {budgetCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedCost">Estimated cost (optional)</Label>
            <Input
              id="estimatedCost"
              type="number"
              min="0"
              step="50"
              placeholder="4500"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
            />
          </div>
          {createVendor.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createVendor.error.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={createVendor.isPending || !category}>
              {createVendor.isPending ? 'Adding…' : 'Add vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
