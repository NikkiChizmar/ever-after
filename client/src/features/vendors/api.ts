import { api } from '@/lib/api';

export type VendorCategory =
  | 'venue' | 'catering' | 'photography' | 'videography' | 'florist' | 'music'
  | 'attire' | 'beauty' | 'transport' | 'stationery' | 'rentals' | 'officiant' | 'other';

export type VendorStatus = 'researching' | 'contacted' | 'quote_received' | 'booked' | 'declined';

export interface Vendor {
  id: string;
  weddingId: string;
  name: string;
  category: VendorCategory;
  status: VendorStatus;
  budgetCategoryId: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  estimatedCost: string | null;
  notes: string | null;
  createdAt: string;
}

export interface VendorPaymentSummary {
  vendorId: string;
  committedAmount: string;
  paidAmount: string;
}

export type PaymentMethod = 'card' | 'check' | 'transfer' | 'cash' | 'other';

export interface PaymentTimelineEntry {
  id: string;
  weddingId: string;
  contractId: string;
  vendorName: string;
  label: string;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  method: PaymentMethod | null;
  notes: string | null;
}

export interface CreateVendorInput {
  name: string;
  category: VendorCategory;
  budgetCategoryId?: string | null;
  estimatedCost?: number;
}

export interface UpdateVendorInput {
  status?: VendorStatus;
  budgetCategoryId?: string | null;
}

export const vendorApi = {
  list: (weddingId: string) => api<{ vendors: Vendor[] }>(`/weddings/${weddingId}/vendors`),
  paymentSummary: (weddingId: string) =>
    api<{ vendorPayments: VendorPaymentSummary[] }>(`/weddings/${weddingId}/vendor-payment-summary`),
  paymentsTimeline: (weddingId: string) =>
    api<{ payments: PaymentTimelineEntry[] }>(`/weddings/${weddingId}/payments-timeline`),
  create: (weddingId: string, input: CreateVendorInput) =>
    api<{ vendor: Vendor }>(`/weddings/${weddingId}/vendors`, { method: 'POST', body: input }),
  update: (weddingId: string, vendorId: string, input: UpdateVendorInput) =>
    api<{ vendor: Vendor }>(`/weddings/${weddingId}/vendors/${vendorId}`, {
      method: 'PATCH',
      body: input,
    }),
  remove: (weddingId: string, vendorId: string) =>
    api<void>(`/weddings/${weddingId}/vendors/${vendorId}`, { method: 'DELETE' }),
};
