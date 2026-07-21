import type { VendorCategory, VendorStatus } from './api';

export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  photography: 'Photography',
  videography: 'Videography',
  florist: 'Florist',
  music: 'Music',
  attire: 'Attire',
  beauty: 'Beauty',
  transport: 'Transport',
  stationery: 'Stationery',
  rentals: 'Rentals',
  officiant: 'Officiant',
  other: 'Other',
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  researching: 'Researching',
  contacted: 'Contacted',
  quote_received: 'Quote received',
  booked: 'Booked',
  declined: 'Declined',
};

// success = committed to; warning = in motion; default = not yet started; destructive = ruled out.
export const VENDOR_STATUS_BADGE_VARIANT: Record<
  VendorStatus,
  'default' | 'warning' | 'success' | 'destructive'
> = {
  researching: 'default',
  contacted: 'warning',
  quote_received: 'warning',
  booked: 'success',
  declined: 'destructive',
};
