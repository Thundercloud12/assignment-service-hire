import { Router } from 'express';
import { authRouter } from './auth.routes';
import { leadRouter } from './lead.routes';
import { activityRouter } from './activity.routes';
import { emailRouter } from './email.routes';
import { analyticsRouter } from './analytics.routes';
import { presetRouter } from './preset.routes';
import { duplicateRouter } from './duplicate.routes';
import { csvRouter } from './csv.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/leads', leadRouter);
apiRouter.use('/activities', activityRouter);
apiRouter.use('/emails', emailRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/filter-presets', presetRouter);
apiRouter.use('/leads/duplicates', duplicateRouter);
apiRouter.use('/leads/csv', csvRouter);