import type { Request, Response } from 'express';
import { z } from 'zod';

import { uuidParam } from '../lib/params.js';
import * as paymentService from '../services/payment.service.js';

const paymentMethod = z.enum(['card', 'check', 'transfer', 'cash', 'other']);

export async function listPayments(req: Request, res: Response) {
  const payments = await paymentService.listPaymentsForContract(
    req.membership!.weddingId,
    uuidParam(req, 'contractId'),
  );
  res.json({ payments });
}

const createPaymentSchema = z.object({
  label: z.string().trim().min(1, 'A label is required, e.g. "Deposit"').max(120),
  // Negative amounts are the deliberate refund mechanism — see docs/data-model.md §2.13.
  amount: z.number(),
  dueDate: z.string().date().optional(),
  paidDate: z.string().date().optional(),
  method: paymentMethod.optional(),
  notes: z.string().max(4000).optional(),
});

export async function createPayment(req: Request, res: Response) {
  const input = createPaymentSchema.parse(req.body);
  const payment = await paymentService.createPayment(
    req.membership!.weddingId,
    uuidParam(req, 'contractId'),
    input,
  );
  res.status(201).json({ payment });
}

const updatePaymentSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  amount: z.number().optional(),
  dueDate: z.string().date().nullable().optional(),
  paidDate: z.string().date().nullable().optional(),
  method: paymentMethod.nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function updatePayment(req: Request, res: Response) {
  const input = updatePaymentSchema.parse(req.body);
  const payment = await paymentService.updatePayment(
    req.membership!.weddingId,
    uuidParam(req, 'paymentId'),
    input,
  );
  res.json({ payment });
}

export async function deletePayment(req: Request, res: Response) {
  await paymentService.deletePayment(req.membership!.weddingId, uuidParam(req, 'paymentId'));
  res.status(204).end();
}
