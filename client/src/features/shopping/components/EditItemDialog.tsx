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
import { useUpdateShoppingItem } from '../hooks';
import type { ShoppingItem } from '../api';

/**
 * Same fields as AddItemDialog, pre-filled from an existing item and saved
 * with a PATCH — purchased status stays a quick toggle on the card itself,
 * same split as tasks (status lives on TaskStatusSelect, not EditTaskDialog).
 */
export function EditItemDialog({
  weddingId,
  item,
  trigger,
}: {
  weddingId: string;
  item: ShoppingItem;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [estimatedCost, setEstimatedCost] = useState(item.estimatedCost ?? '');
  const [store, setStore] = useState(item.store ?? '');
  const updateItem = useUpdateShoppingItem(weddingId);

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(item.name);
      setQuantity(String(item.quantity));
      setEstimatedCost(item.estimatedCost ?? '');
      setStore(item.store ?? '');
    }
    setOpen(next);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateItem.mutate(
      {
        itemId: item.id,
        input: {
          name,
          quantity: quantity ? Number(quantity) : undefined,
          estimatedCost: estimatedCost ? Number(estimatedCost) : null,
          store: store.trim() || null,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
          <DialogDescription>Update the details — purchased status stays a quick pick from the card.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editItemName">Item</Label>
            <Input
              id="editItemName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editItemQuantity">Quantity</Label>
              <Input
                id="editItemQuantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editItemCost">Estimated cost (optional)</Label>
              <Input
                id="editItemCost"
                type="number"
                min="0"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editItemStore">Store (optional)</Label>
            <Input
              id="editItemStore"
              placeholder="Amazon, Michaels, Etsy…"
              value={store}
              onChange={(e) => setStore(e.target.value)}
            />
          </div>
          {updateItem.isError && (
            <p role="alert" className="text-sm text-destructive">
              {updateItem.error.message}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={updateItem.isPending || !name.trim()}>
              {updateItem.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
