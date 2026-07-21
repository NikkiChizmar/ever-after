import { Router } from 'express';

import {
  createContract,
  deleteContract,
  listContracts,
  updateContract,
} from '../controllers/contract.controller.js';
import {
  createPayment,
  deletePayment,
  listPayments,
  updatePayment,
} from '../controllers/payment.controller.js';
import {
  createVendor,
  deleteVendor,
  getVendor,
  listVendors,
  updateVendor,
} from '../controllers/vendor.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

export const vendorRouter: Router = Router({ mergeParams: true });

vendorRouter.get('/vendors', requireWeddingRole('viewer'), listVendors);
vendorRouter.post('/vendors', requireWeddingRole('editor'), createVendor);
vendorRouter.get('/vendors/:vendorId', requireWeddingRole('viewer'), getVendor);
vendorRouter.patch('/vendors/:vendorId', requireWeddingRole('editor'), updateVendor);
vendorRouter.delete('/vendors/:vendorId', requireWeddingRole('editor'), deleteVendor);

// Contracts and payments are reached only through their vendor — there is no
// bare /contracts collection, matching how the product is used (money is
// always "this vendor's money").
vendorRouter.get('/vendors/:vendorId/contracts', requireWeddingRole('viewer'), listContracts);
vendorRouter.post('/vendors/:vendorId/contracts', requireWeddingRole('editor'), createContract);
vendorRouter.patch(
  '/vendors/:vendorId/contracts/:contractId',
  requireWeddingRole('editor'),
  updateContract,
);
vendorRouter.delete(
  '/vendors/:vendorId/contracts/:contractId',
  requireWeddingRole('editor'),
  deleteContract,
);

vendorRouter.get(
  '/vendors/:vendorId/contracts/:contractId/payments',
  requireWeddingRole('viewer'),
  listPayments,
);
vendorRouter.post(
  '/vendors/:vendorId/contracts/:contractId/payments',
  requireWeddingRole('editor'),
  createPayment,
);
vendorRouter.patch(
  '/vendors/:vendorId/contracts/:contractId/payments/:paymentId',
  requireWeddingRole('editor'),
  updatePayment,
);
vendorRouter.delete(
  '/vendors/:vendorId/contracts/:contractId/payments/:paymentId',
  requireWeddingRole('editor'),
  deletePayment,
);
