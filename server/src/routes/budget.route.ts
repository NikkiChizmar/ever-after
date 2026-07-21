import { Router } from 'express';

import {
  createCategory,
  deleteCategory,
  getSummary,
  listCategories,
  updateCategory,
} from '../controllers/budget.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

// mergeParams: true — this router is mounted at /weddings/:weddingId/..., and
// without it req.params.weddingId would be invisible to every handler here.
export const budgetRouter: Router = Router({ mergeParams: true });

budgetRouter.get('/budget-summary', requireWeddingRole('viewer'), getSummary);

budgetRouter.get('/budget-categories', requireWeddingRole('viewer'), listCategories);
budgetRouter.post('/budget-categories', requireWeddingRole('editor'), createCategory);
budgetRouter.patch('/budget-categories/:categoryId', requireWeddingRole('editor'), updateCategory);
budgetRouter.delete('/budget-categories/:categoryId', requireWeddingRole('editor'), deleteCategory);
