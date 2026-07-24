import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useUpdateVendor } from '../hooks';
import { VENDOR_STATUS_BADGE_VARIANT, VENDOR_STATUS_LABELS } from '../constants';
import type { VendorStatus } from '../api';

const STATUS_OPTIONS = Object.entries(VENDOR_STATUS_LABELS) as [VendorStatus, string][];

/**
 * A badge that's secretly a select — click it, pick a new status, it saves
 * immediately. No separate "edit vendor" flow needed for the one field
 * people change constantly while shopping vendors.
 */
export function VendorStatusSelect({ weddingId, vendorId, status }: { weddingId: string; vendorId: string; status: VendorStatus }) {
  const updateVendor = useUpdateVendor(weddingId);

  return (
    <Select
      value={status}
      onValueChange={(next) => updateVendor.mutate({ vendorId, input: { status: next as VendorStatus } })}
    >
      <SelectTrigger className="h-auto w-auto border-none bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:hidden">
        <Badge variant={VENDOR_STATUS_BADGE_VARIANT[status]}>{VENDOR_STATUS_LABELS[status]}</Badge>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
