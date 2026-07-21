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
import { budgetRouter } from './budget.route.js';
import { eventRouter } from './event.route.js';
import { guestRouter } from './guest.route.js';
import { invitationRouter } from './invitation.route.js';
import { partyRouter } from './party.route.js';
import { vendorRouter } from './vendor.route.js';

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

// Money domain: each sub-router applies its own per-route role checks.
weddingRouter.use('/:weddingId', budgetRouter);
weddingRouter.use('/:weddingId', vendorRouter);

// Guests & RSVPs domain.
weddingRouter.use('/:weddingId', partyRouter);
weddingRouter.use('/:weddingId', guestRouter);
weddingRouter.use('/:weddingId', eventRouter);
weddingRouter.use('/:weddingId', invitationRouter);
