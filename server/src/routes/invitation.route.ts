import { Router } from 'express';

import { removeInvitation, updateInvitation } from '../controllers/invitation.controller.js';
import { requireWeddingRole } from '../middleware/wedding-access.js';

/**
 * A single invitation is addressable by its own id — updating an RSVP or
 * meal choice doesn't need the event in the URL, unlike creating one
 * (which does, see event.route.ts).
 */
export const invitationRouter: Router = Router({ mergeParams: true });

invitationRouter.patch('/invitations/:invitationId', requireWeddingRole('editor'), updateInvitation);
invitationRouter.delete('/invitations/:invitationId', requireWeddingRole('editor'), removeInvitation);
