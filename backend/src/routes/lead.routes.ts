import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createLeadSchema, updateLeadSchema } from '../validators/lead.validation';

export const leadRouter = Router();

leadRouter.use(authMiddleware);

leadRouter.post('/', validateBody(createLeadSchema), leadController.createLead);
leadRouter.get('/', leadController.getLeads);
leadRouter.get('/:id', leadController.getLead);
leadRouter.put('/:id', validateBody(updateLeadSchema), leadController.updateLead);
leadRouter.delete('/:id', leadController.deleteLead);
