import { Router } from 'express';
import { analyticsService } from '../services/analytics.service';
import { graphService } from '../services/graph.service';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware';
import { ApiError } from '../errors/ApiError';

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);

// Get analytics data for the authenticated user's dashboard (Admin only)
analyticsRouter.get('/', authorizeRoles(['admin']), async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const data = await analyticsService.getDashboardMetrics(req.user.id, req.user.role, req.user.organizationId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/network-graph - Relationship network graph nodes and edges
analyticsRouter.get('/network-graph', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const data = await graphService.getNetworkGraphData(req.user.id, req.user.role, req.user.organizationId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/score-influencer/:leadId - Lead score breakdown factors graph nodes and edges
analyticsRouter.get('/score-influencer/:leadId', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const data = await graphService.getScoreInfluencerGraphData(req.params.leadId, req.user.id, req.user.role, req.user.organizationId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});
