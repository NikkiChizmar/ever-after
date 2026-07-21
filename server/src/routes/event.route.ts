import { Router } from 'express';

import { createEvent, deleteEvent, listEvents, updateEvent } from '../controllers/event.controller.js';
import { inviteGuest, inviteParty, listRoster } from '../controllers/invitation.controller.js';
import {
  createMealOption,
  deleteMealOption,
  listMealOptions,
  updateMealOption,
} from '../controllers/meal.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

export const eventRouter: Router = Router({ mergeParams: true });

eventRouter.get('/events', requireWeddingRole('viewer'), listEvents);
eventRouter.post('/events', requireWeddingRole('editor'), createEvent);
eventRouter.patch('/events/:eventId', requireWeddingRole('editor'), updateEvent);
eventRouter.delete('/events/:eventId', requireWeddingRole('editor'), deleteEvent);

eventRouter.get('/events/:eventId/meal-options', requireWeddingRole('viewer'), listMealOptions);
eventRouter.post('/events/:eventId/meal-options', requireWeddingRole('editor'), createMealOption);
eventRouter.patch(
  '/events/:eventId/meal-options/:mealOptionId',
  requireWeddingRole('editor'),
  updateMealOption,
);
eventRouter.delete(
  '/events/:eventId/meal-options/:mealOptionId',
  requireWeddingRole('editor'),
  deleteMealOption,
);

// The roster: who's invited to this event and how they've responded.
eventRouter.get('/events/:eventId/invitations', requireWeddingRole('viewer'), listRoster);
eventRouter.post('/events/:eventId/invitations', requireWeddingRole('editor'), inviteGuest);
eventRouter.post('/events/:eventId/invitations/party', requireWeddingRole('editor'), inviteParty);
