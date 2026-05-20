import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { generateEmailSchema } from '../validators/ai.validator';

export const aiRouter = Router();

aiRouter.use(authMiddleware);

// POST endpoint to compile context-aware sales drafts
aiRouter.post('/generate-email', validateBody(generateEmailSchema), aiController.generateEmailDraftHandler);
