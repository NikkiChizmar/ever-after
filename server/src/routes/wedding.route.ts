import { Router } from 'express';

import {
  addMember,
  createWedding,
  getWedding,
  listMembers,
  listMyWeddings,
  updateWedding,
} from '../controllers/wedding.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

export const weddingRouter: Router = Router();

// Everything below requires a logged-in user…
weddingRouter.use(requireAuth);

weddingRouter.post('/', createWedding);
weddingRouter.get('/', listMyWeddings);

// …and everything with a :weddingId also requires membership at a minimum role.
weddingRouter.get('/:weddingId', requireWeddingRole('viewer'), getWedding);
weddingRouter.patch('/:weddingId', requireWeddingRole('editor'), updateWedding);
weddingRouter.get('/:weddingId/members', requireWeddingRole('viewer'), listMembers);
weddingRouter.post('/:weddingId/members', requireWeddingRole('owner'), addMember);
