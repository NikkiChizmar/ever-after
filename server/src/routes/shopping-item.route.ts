import { Router } from 'express';

import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  updateItem,
} from '../controllers/shopping-item.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

export const shoppingItemRouter: Router = Router({ mergeParams: true });

shoppingItemRouter.get('/shopping-items', requireWeddingRole('viewer'), listItems);
shoppingItemRouter.post('/shopping-items', requireWeddingRole('editor'), createItem);
shoppingItemRouter.get('/shopping-items/:itemId', requireWeddingRole('viewer'), getItem);
shoppingItemRouter.patch('/shopping-items/:itemId', requireWeddingRole('editor'), updateItem);
shoppingItemRouter.delete('/shopping-items/:itemId', requireWeddingRole('editor'), deleteItem);
