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

// Cycles through the 7-hue chart palette (see styles/index.css) — enough
// categories share a color that two adjacent bars could collide, which is
// fine: a legend/tooltip disambiguates, and 7 distinct hues reads cleaner
// than 13 similar ones would.
const CHART_COLOR_VARS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
];

export const VENDOR_CATEGORY_COLORS: Record<VendorCategory, string> = {
  venue: CHART_COLOR_VARS[0]!,
  photography: CHART_COLOR_VARS[1]!,
  videography: CHART_COLOR_VARS[2]!,
  florist: CHART_COLOR_VARS[3]!,
  music: CHART_COLOR_VARS[4]!,
  beauty: CHART_COLOR_VARS[5]!,
  rentals: CHART_COLOR_VARS[6]!,
  catering: CHART_COLOR_VARS[0]!,
  attire: CHART_COLOR_VARS[1]!,
  transport: CHART_COLOR_VARS[2]!,
  stationery: CHART_COLOR_VARS[3]!,
  officiant: CHART_COLOR_VARS[4]!,
  other: CHART_COLOR_VARS[6]!,
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

// A pipeline, not a palette: neutral (researching) -> blue (in motion) ->
// gold (a real quote in hand) -> primary green (booked, the "won" state) ->
// red breaks the sequence deliberately, since declined isn't a further
// stage, it's an exit.
export const VENDOR_STATUS_CHART_COLORS: Record<VendorStatus, string> = {
  researching: 'var(--color-chart-7)',
  contacted: 'var(--color-chart-3)',
  quote_received: 'var(--color-chart-2)',
  booked: 'var(--color-primary)',
  declined: 'var(--color-destructive)',
};

// Left-to-right stacking order for the pipeline chart.
export const VENDOR_STATUS_ORDER: VendorStatus[] = [
  'booked',
  'quote_received',
  'contacted',
  'researching',
  'declined',
];
