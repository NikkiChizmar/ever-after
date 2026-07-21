import { Router } from 'express';

import { createParty, deleteParty, listParties, updateParty } from '../controllers/party.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

export const partyRouter: Router = Router({ mergeParams: true });

partyRouter.get('/parties', requireWeddingRole('viewer'), listParties);
partyRouter.post('/parties', requireWeddingRole('editor'), createParty);
partyRouter.patch('/parties/:partyId', requireWeddingRole('editor'), updateParty);
partyRouter.delete('/parties/:partyId', requireWeddingRole('editor'), deleteParty);
