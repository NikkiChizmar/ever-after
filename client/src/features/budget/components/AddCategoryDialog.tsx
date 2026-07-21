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
import { useCreateCategory } from '../hooks';

export function AddCategoryDialog({ weddingId, trigger }: { weddingId: string; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [plannedAmount, setPlannedAmount] = useState('');
  const createCategory = useCreateCategory(weddingId);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createCategory.mutate(
      { name, plannedAmount: plannedAmount ? Number(plannedAmount) : undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setPlannedAmount('');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New budget category</DialogTitle>
          <DialogDescription>Group vendor spending under a category, like "Catering."</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoryName">Name</Label>
            <Input
              id="categoryName"
              placeholder="Catering"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plannedAmount">Planned amount</Label>
            <Input
              id="plannedAmount"
              type="number"
              min="0"
              step="100"
              placeholder="12000"
              value={plannedAmount}
              onChange={(e) => setPlannedAmount(e.target.value)}
            />
          </div>
          {createCategory.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createCategory.error.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Adding…' : 'Add category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
