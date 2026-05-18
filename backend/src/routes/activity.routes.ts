import { Router } from 'express';
import { activityService } from '../services/activity.service';
import { leadService } from '../services/lead.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { ApiError } from '../errors/ApiError';

export const activityRouter = Router();

activityRouter.use(authMiddleware);

// Get activities for a specific lead
activityRouter.get('/:leadId', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    const { leadId } = req.params;
    
    const lead = await leadService.getLeadById(leadId, req.user.id, req.user.role, req.user.organizationId);
    if (!lead) {
      throw new ApiError('Lead not found or access denied', 404);
    }

    const page = parseInt(req.query.page as string ?? '1', 10);
    const limit = parseInt(req.query.limit as string ?? '10', 10);

    const result = await activityService.getActivitiesForLead(leadId, page, limit);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// Add a manual note/activity to a lead
activityRouter.post('/:leadId', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { leadId } = req.params;
    const lead = await leadService.getLeadById(leadId, req.user.id, req.user.role, req.user.organizationId);
    if (!lead) {
      throw new ApiError('Lead not found or access denied', 404);
    }

    const { note } = req.body;

    if (!note || typeof note !== 'string' || !note.trim()) {
      throw new ApiError('Note content is required', 400);
    }

    const activity = await activityService.logActivity({
      leadId,
      actionType: 'note_added',
      performedBy: req.user.id,
      newValue: note.trim(),
      metadata: { note: note.trim() },
    });

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: activity,
    });
  } catch (error) {
    next(error);
  }
});
