import { Activity, type IActivity } from '../models/Activity';
import logger from '../config/logger';

interface ActivityLogParams {
  leadId: string;
  actionType: IActivity['actionType'];
  performedBy: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, any>;
}

class ActivityService {
  async logActivity(params: ActivityLogParams): Promise<IActivity> {
    try {
      const activity = await Activity.create({
        leadId: params.leadId,
        actionType: params.actionType,
        performedBy: params.performedBy,
        oldValue: params.oldValue,
        newValue: params.newValue,
        metadata: params.metadata || {},
      });

      logger.info(`Activity logged: ${params.actionType} on lead: ${params.leadId}`);
      return activity;
    } catch (error) {
      logger.error(`Error logging activity: ${error}`);
      throw error;
    }
  }

  async getActivitiesForLead(leadId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const activities = await Activity.find({ leadId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'fullName email')
        .lean();

      const total = await Activity.countDocuments({ leadId });
      const totalPages = Math.ceil(total / limit);

      return {
        data: activities,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error(`Error fetching activities for lead ${leadId}: ${error}`);
      throw error;
    }
  }
}

export const activityService = new ActivityService();
