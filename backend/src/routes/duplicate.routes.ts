import { Router } from 'express';
import { duplicateService } from '../services/duplicate.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { ApiError } from '../errors/ApiError';

export const duplicateRouter = Router();

duplicateRouter.use(authMiddleware);

// Scan leads and group potential duplicates
duplicateRouter.get('/scan', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    const groups = await duplicateService.findDuplicateGroups(req.user.id, req.user.role, req.user.organizationId);
    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
});

// Merge duplicate lead into primary lead
duplicateRouter.post('/merge', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { primaryId, duplicateId } = req.body;

    if (!primaryId || !duplicateId) {
      throw new ApiError('Both primaryId and duplicateId are required', 400);
    }

    const result = await duplicateService.mergeLeads(primaryId, duplicateId, req.user.id, req.user.role, req.user.organizationId);

    res.json({
      success: true,
      message: 'Leads merged successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
