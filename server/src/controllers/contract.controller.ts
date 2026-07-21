import type { Request, Response } from 'express';
import { z } from 'zod';

import { param } from '../lib/params.js';
import * as contractService from '../services/contract.service.js';

export async function listContracts(req: Request, res: Response) {
  const contracts = await contractService.listContractsForVendor(
    req.membership!.weddingId,
    param(req, 'vendorId'),
  );
  res.json({ contracts });
}

const createContractSchema = z.object({
  title: z.string().trim().max(200).optional(),
  totalAmount: z.number().nonnegative(),
  signedOn: z.string().date().optional(),
  notes: z.string().max(4000).optional(),
});

export async function createContract(req: Request, res: Response) {
  const input = createContractSchema.parse(req.body);
  const contract = await contractService.createContract(
    req.membership!.weddingId,
    param(req, 'vendorId'),
    input,
  );
  res.status(201).json({ contract });
}

const updateContractSchema = z.object({
  title: z.string().trim().max(200).nullable().optional(),
  totalAmount: z.number().nonnegative().optional(),
  signedOn: z.string().date().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function updateContract(req: Request, res: Response) {
  const input = updateContractSchema.parse(req.body);
  const contract = await contractService.updateContract(
    req.membership!.weddingId,
    param(req, 'contractId'),
    input,
  );
  res.json({ contract });
}

export async function deleteContract(req: Request, res: Response) {
  await contractService.deleteContract(req.membership!.weddingId, param(req, 'contractId'));
  res.status(204).end();
}
