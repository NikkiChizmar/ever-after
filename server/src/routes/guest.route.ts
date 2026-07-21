import { Router } from 'express';

import {
  addDietaryTag,
  createGuest,
  deleteGuest,
  getGuest,
  listGuests,
  removeDietaryTag,
  updateGuest,
} from '../controllers/guest.controller.js';
import { listInvitationsForGuest } from '../controllers/invitation.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

export const guestRouter: Router = Router({ mergeParams: true });

guestRouter.get('/guests', requireWeddingRole('viewer'), listGuests);
guestRouter.post('/guests', requireWeddingRole('editor'), createGuest);
guestRouter.get('/guests/:guestId', requireWeddingRole('viewer'), getGuest);
guestRouter.patch('/guests/:guestId', requireWeddingRole('editor'), updateGuest);
guestRouter.delete('/guests/:guestId', requireWeddingRole('editor'), deleteGuest);

guestRouter.post('/guests/:guestId/dietary-tags', requireWeddingRole('editor'), addDietaryTag);
guestRouter.delete('/guests/:guestId/dietary-tags/:tag', requireWeddingRole('editor'), removeDietaryTag);

// A guest's full RSVP picture across every event — useful for a guest detail view.
guestRouter.get('/guests/:guestId/invitations', requireWeddingRole('viewer'), listInvitationsForGuest);
