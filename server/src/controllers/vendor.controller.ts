import type { Request, Response } from 'express';
import { z } from 'zod';

import { uuidParam } from '../lib/params.js';
import * as vendorService from '../services/vendor.service.js';

const vendorCategory = z.enum([
  'venue', 'catering', 'photography', 'videography', 'florist', 'music',
  'attire', 'beauty', 'transport', 'stationery', 'rentals', 'officiant', 'other',
]);
const vendorStatus = z.enum(['researching', 'contacted', 'quote_received', 'booked', 'declined']);

export async function listVendors(req: Request, res: Response) {
  const vendors = await vendorService.listVendors(req.membership!.weddingId);
  res.json({ vendors });
}

const createVendorSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required').max(200),
  category: vendorCategory,
  status: vendorStatus.optional(),
  budgetCategoryId: z.string().uuid().nullable().optional(),
  contactName: z.string().trim().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().url().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  notes: z.string().max(4000).optional(),
});

export async function createVendor(req: Request, res: Response) {
  const input = createVendorSchema.parse(req.body);
  const vendor = await vendorService.createVendor(req.membership!.weddingId, input);
  res.status(201).json({ vendor });
}

export async function getVendor(req: Request, res: Response) {
  const vendor = await vendorService.getVendor(req.membership!.weddingId, uuidParam(req, 'vendorId'));
  res.json({ vendor });
}

const updateVendorSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  category: vendorCategory.optional(),
  status: vendorStatus.optional(),
  budgetCategoryId: z.string().uuid().nullable().optional(),
  contactName: z.string().trim().max(200).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  website: z.string().url().nullable().optional(),
  estimatedCost: z.number().nonnegative().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function updateVendor(req: Request, res: Response) {
  const input = updateVendorSchema.parse(req.body);
  const vendor = await vendorService.updateVendor(
    req.membership!.weddingId,
    uuidParam(req, 'vendorId'),
    input,
  );
  res.json({ vendor });
}

export async function deleteVendor(req: Request, res: Response) {
  await vendorService.deleteVendor(req.membership!.weddingId, uuidParam(req, 'vendorId'));
  res.status(204).end();
}

export async function getVendorPaymentSummary(req: Request, res: Response) {
  const vendorPayments = await vendorService.getVendorPaymentSummary(req.membership!.weddingId);
  res.json({ vendorPayments });
}
