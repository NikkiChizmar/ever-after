import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { vendorApi, type CreateVendorInput, type UpdateVendorInput } from './api';

const vendorsKey = (weddingId: string) => ['weddings', weddingId, 'vendors'];
// Vendors carry committed/paid amounts through the budget summary, so any
// vendor write can change those rollups too — invalidate both together.
const summaryKey = (weddingId: string) => ['weddings', weddingId, 'budget-summary'];

export function useVendors(weddingId: string) {
  return useQuery({
    queryKey: vendorsKey(weddingId),
    queryFn: async () => (await vendorApi.list(weddingId)).vendors,
  });
}

const paymentSummaryKey = (weddingId: string) => ['weddings', weddingId, 'vendor-payment-summary'];

export function useVendorPaymentSummary(weddingId: string) {
  return useQuery({
    queryKey: paymentSummaryKey(weddingId),
    queryFn: async () => (await vendorApi.paymentSummary(weddingId)).vendorPayments,
  });
}

export function useCreateVendor(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVendorInput) => vendorApi.create(weddingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsKey(weddingId) });
      queryClient.invalidateQueries({ queryKey: summaryKey(weddingId) });
    },
  });
}

export function useUpdateVendor(weddingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, input }: { vendorId: string; input: UpdateVendorInput }) =>
      vendorApi.update(weddingId, vendorId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorsKey(weddingId) });
      queryClient.invalidateQueries({ queryKey: summaryKey(weddingId) });
    },
  });
}
