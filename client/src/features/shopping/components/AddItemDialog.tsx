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
import { useCreateShoppingItem } from '../hooks';

export function AddItemDialog({
  weddingId,
  trigger,
}: {
  weddingId: string;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [store, setStore] = useState('');
  const createItem = useCreateShoppingItem(weddingId);

  function reset() {
    setName('');
    setQuantity('1');
    setEstimatedCost('');
    setStore('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createItem.mutate(
      {
        name,
        quantity: quantity ? Number(quantity) : undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        store: store.trim() || undefined,
      },
      { onSuccess: () => { setOpen(false); reset(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New item</DialogTitle>
          <DialogDescription>Something to buy — favors, decor, signage, whatever's next.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item</Label>
            <Input
              id="itemName"
              placeholder="Table runners"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemQuantity">Quantity</Label>
              <Input
                id="itemQuantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemCost">Estimated cost (optional)</Label>
              <Input
                id="itemCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="45"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="itemStore">Store (optional)</Label>
            <Input
              id="itemStore"
              placeholder="Amazon, Michaels, Etsy…"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            />
          </div>
          {createItem.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createItem.error.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={createItem.isPending || !name.trim()}>
              {createItem.isPending ? 'Adding…' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
