import { CheckCircle2Icon, CircleIcon, PencilIcon, StoreIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DEMO_MODE } from '@/lib/demo';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useUpdateShoppingItem } from '../hooks';
import { EditItemDialog } from './EditItemDialog';
import type { ShoppingItem } from '../api';

interface ShoppingItemCardProps {
  weddingId: string;
  item: ShoppingItem;
  currency: string;
  onDelete: () => void;
}

/**
 * Same "achievement-style" card as TaskCard — purchased is a simple
 * two-state toggle (not a status select, there's only bought/not-bought),
 * so it's a plain clickable badge rather than TaskStatusSelect's dropdown.
 */
export function ShoppingItemCard({ weddingId, item, currency, onDelete }: ShoppingItemCardProps) {
  const updateItem = useUpdateShoppingItem(weddingId);
  const isPurchased = item.purchased;

  return (
    <div
      className={cn(
        'mini-card group flex flex-col gap-3 p-4 animate-in fade-in-0 slide-in-from-top-1 duration-300',
        isPurchased && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-sm font-semibold leading-snug text-card-foreground',
            isPurchased && 'text-foreground/60 line-through',
          )}
        >
          {item.name}
          {item.quantity > 1 && (
            <span className="ml-1.5 font-normal text-muted-foreground">×{item.quantity}</span>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <EditItemDialog
            weddingId={weddingId}
            item={item}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground size-7 hover:text-primary"
                disabled={DEMO_MODE}
                title={DEMO_MODE ? 'Read-only demo' : 'Edit item'}
              >
                <PencilIcon className="size-3.5" />
                <span className="sr-only">Edit {item.name}</span>
              </Button>
            }
          />
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground size-7 hover:text-destructive"
            onClick={onDelete}
            disabled={DEMO_MODE}
            title={DEMO_MODE ? 'Read-only demo' : undefined}
          >
            <Trash2Icon className="size-3.5" />
            <span className="sr-only">Delete {item.name}</span>
          </Button>
        </div>
      </div>

      {(item.estimatedCost || item.store) && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {item.estimatedCost && <p>{formatMoney(item.estimatedCost, currency)} estimated</p>}
          {item.store && (
            <p className="flex items-center gap-1.5">
              <StoreIcon className="size-3.5 shrink-0" />
              {item.store}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-1">
        <button
          type="button"
          disabled={DEMO_MODE}
          title={DEMO_MODE ? 'Read-only demo' : undefined}
          onClick={() => updateItem.mutate({ itemId: item.id, input: { purchased: !isPurchased } })}
          className="disabled:cursor-not-allowed"
        >
          <Badge
            variant={isPurchased ? 'success' : 'default'}
            className={cn(
              'gap-1.5 px-2.5 py-1 text-xs font-semibold transition-colors',
              isPurchased && 'bg-primary text-primary-foreground',
            )}
          >
            {isPurchased ? <CheckCircle2Icon className="size-3.5" /> : <CircleIcon className="size-3.5" />}
            {isPurchased ? 'Purchased' : 'To buy'}
          </Badge>
        </button>
      </div>
    </div>
  );
}
