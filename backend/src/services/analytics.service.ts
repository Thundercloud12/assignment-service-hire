import mongoose from 'mongoose';
import { Lead } from '../models/Lead';
import logger from '../config/logger';

class AnalyticsService {
  async getDashboardMetrics(userId: string, userRole?: string, organizationId?: string) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const matchQuery: Record<string, any> = { deletedAt: null };
      if (organizationId) {
        matchQuery.organizationId = new mongoose.Types.ObjectId(organizationId);
      }
      
      if (userRole !== 'admin') {
        matchQuery.$or = [{ createdBy: userObjectId }, { assignedTo: userObjectId }];
      }

      // KPI Counts
      const totalLeads = await Lead.countDocuments(matchQuery);
      const qualifiedLeads = await Lead.countDocuments({
        ...matchQuery,
        status: 'qualified',
      });
      const contactedLeads = await Lead.countDocuments({
        ...matchQuery,
        status: 'contacted',
      });

      const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

      // Average Lead Score
      const avgScoreResult = await Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, avgScore: { $avg: '$leadScore' } } },
      ]);
      const avgLeadScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

      // Status Distribution
      const statusDistribution = await Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const statusMap: Record<string, number> = { new: 0, contacted: 0, qualified: 0, lost: 0 };
      statusDistribution.forEach((item) => {
        if (item._id) {
          statusMap[item._id] = item.count;
        }
      });

      // Source Distribution
      const sourceDistribution = await Lead.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]);

      const sourceMap: Record<string, number> = { website: 0, instagram: 0, referral: 0, other: 0 };
      sourceDistribution.forEach((item) => {
        if (item._id) {
          sourceMap[item._id] = item.count;
        }
      });

      // Leads Over Time (grouped by date) - Last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const leadsOverTime = await Lead.aggregate([
        {
          $match: {
            ...matchQuery,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Assignee Distribution (User Performance)
      const assigneeDistribution = await Lead.aggregate([
        { $match: { ...matchQuery, assignedTo: { $ne: null } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        {
          $project: {
            _id: 1,
            count: 1,
            fullName: '$userInfo.fullName',
            email: '$userInfo.email',
          },
        },
        { $sort: { count: -1 } },
      ]);

      return {
        kpis: {
          totalLeads,
          qualifiedLeads,
          contactedLeads,
          conversionRate,
          avgLeadScore,
        },
        statusDistribution: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
        sourceDistribution: Object.entries(sourceMap).map(([source, count]) => ({ source, count })),
        leadsOverTime: leadsOverTime.map((item) => ({ date: item._id, count: item.count })),
        assigneePerformance: assigneeDistribution,
      };
    } catch (error) {
      logger.error(`Error calculating analytics: ${error}`);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
