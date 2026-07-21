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
import type { BudgetCategory } from '../api';
import { useDeleteCategory, useUpdateCategory } from '../hooks';

/**
 * Budgets change constantly as plans firm up — editing a planned amount is
 * a one-off dialog here rather than inline-editable text, which keeps the
 * card layout stable and gives room for the delete action alongside it.
 */
export function EditCategoryDialog({
  weddingId,
  category,
  trigger,
}: {
  weddingId: string;
  category: BudgetCategory;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);
  const [plannedAmount, setPlannedAmount] = useState(category.plannedAmount);
  const updateCategory = useUpdateCategory(weddingId);
  const deleteCategory = useDeleteCategory(weddingId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateCategory.mutate(
      { categoryId: category.id, input: { name, plannedAmount: Number(plannedAmount) } },
      { onSuccess: () => setOpen(false) },
    );
  }

  function handleDelete() {
    if (!confirm(`Delete "${category.name}"? Vendors in it become uncategorized — nothing else is lost.`)) {
      return;
    }
    deleteCategory.mutate(category.id, { onSuccess: () => setOpen(false) });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>Plans change — update the planned amount as they do.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editName">Name</Label>
            <Input id="editName" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editPlanned">Planned amount</Label>
            <Input
              id="editPlanned"
              type="number"
              min="0"
              step="100"
              value={plannedAmount}
              onChange={(e) => setPlannedAmount(e.target.value)}
            />
          </div>
          {(updateCategory.isError || deleteCategory.isError) && (
            <p role="alert" className="text-sm text-destructive">
              {(updateCategory.error ?? deleteCategory.error)?.message}
            </p>
          )}
          <DialogFooter className="justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              Delete
            </Button>
            <Button type="submit" disabled={updateCategory.isPending}>
              {updateCategory.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
