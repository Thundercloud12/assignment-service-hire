import logger from '../config/logger';
import { ApiError } from '../errors/ApiError';
import type { ILead, ILeadFilter, ILeadPublic } from '../interfaces/ILead';
import { Lead } from '../models/Lead';
import { activityService } from './activity.service';
import { Activity } from '../models/Activity';
import { EmailHistory } from '../models/EmailHistory';
import type { CreateLeadInput, UpdateLeadInput } from '../validators/lead.validation';

type SortField = 'createdAt' | 'name' | 'leadScore';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const toLeadPublic = (doc: any): ILeadPublic => {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    status: doc.status,
    source: doc.source,
    leadScore: doc.leadScore,
    assignedTo: doc.assignedTo ? (doc.assignedTo._id ? doc.assignedTo._id.toString() : doc.assignedTo.toString()) : undefined,
    createdBy: doc.createdBy ? (doc.createdBy._id ? doc.createdBy._id.toString() : doc.createdBy.toString()) : '',
    organizationId: doc.organizationId?.toString() ?? '',
    lastContactedAt: doc.lastContactedAt,
    customFields: doc.customFields,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const logLeadError = (context: string, error: unknown): void => {
  logger.error(context);
  console.error(error);

  if (typeof error === 'object' && error !== null && 'errors' in error) {
    Object.values((error as { errors?: Record<string, { path?: string; message?: string }> }).errors ?? {}).forEach((issue) => {
      console.log(issue.path, issue.message);
    });
  }
};

class LeadService {
  async recalculateLeadScore(leadId: string, userId: string): Promise<number> {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) return 0;

      // 1. Source Score (Referral: 40, Website: 20, Instagram: 10, Other: 5)
      const sourceScores: Record<string, number> = {
        referral: 40,
        website: 20,
        instagram: 10,
        other: 5,
      };
      const sourceScore = sourceScores[lead.source.toLowerCase()] ?? 0;

      // 2. Engagement Score
      let engagementScore = 0;

      // Status factor
      if (lead.status !== 'new') {
        engagementScore += 20; // contacted/qualified/lost
      }

      // Emails factor
      const emails = await EmailHistory.find({ leadId });
      emails.forEach((email) => {
        if (email.status === 'clicked') {
          engagementScore += 25; // 10 (open) + 15 (click) = 25
        } else if (email.status === 'opened') {
          engagementScore += 10;
        } else if (email.status === 'sent') {
          engagementScore += 5;
        }
      });

      // Notes/activities factor
      const noteCount = await Activity.countDocuments({ leadId, actionType: 'note_added' });
      engagementScore += Math.min(noteCount * 5, 30);

      // Clamp engagement score to 100
      engagementScore = Math.min(engagementScore, 100);

      // 3. Recency Score
      let recencyScore = 5;
      const now = new Date();
      const diffMs = now.getTime() - new Date(lead.createdAt).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        recencyScore = 50;
      } else if (diffDays <= 7) {
        recencyScore = 40;
      } else if (diffDays <= 30) {
        recencyScore = 30;
      } else if (diffDays <= 90) {
        recencyScore = 15;
      } else {
        recencyScore = 5;
      }

      // 4. Total Score
      const totalScore = Math.min(Math.max(Math.round((sourceScore + engagementScore + recencyScore) / 3), 0), 100);

      const oldScore = lead.leadScore;
      if (oldScore !== totalScore) {
        lead.leadScore = totalScore;
        await lead.save();

        await activityService.logActivity({
          leadId: String(lead._id),
          actionType: 'score_updated',
          performedBy: userId,
          oldValue: String(oldScore),
          newValue: String(totalScore),
          metadata: {
            reason: 'Score recalculated',
            sourceScore,
            engagementScore,
            recencyScore,
          },
        });
      }

      return totalScore;
    } catch (error) {
      logger.error(`Error recalculating lead score: ${error}`);
      return 0;
    }
  }

  async createLead(input: CreateLeadInput, userId: string, organizationId?: string): Promise<ILeadPublic> {
    try {
      const existingLead = await Lead.findOne({
        email: input.email,
        organizationId,
        deletedAt: null,
      });

      if (existingLead) {
        throw new ApiError('Lead with this email already exists in your workspace', 409);
      }

      const initialScore = this.calculateInitialScore(input.source);

      const lead = await Lead.create({
        ...input,
        createdBy: userId,
        organizationId,
        leadScore: initialScore,
        assignedTo: input.assignedTo || null,
        phone: input.phone || undefined,
      });

      logger.info(`Lead created: ${lead._id} by user: ${userId}`);

      // Log creation activities
      await activityService.logActivity({
        leadId: String(lead._id),
        actionType: 'status_changed',
        performedBy: userId,
        oldValue: undefined,
        newValue: 'new',
        metadata: { reason: 'Lead created' },
      });

      if (lead.assignedTo) {
        await activityService.logActivity({
          leadId: String(lead._id),
          actionType: 'assigned_to_user',
          performedBy: userId,
          oldValue: undefined,
          newValue: String(lead.assignedTo),
          metadata: { reason: 'Lead assigned during creation' },
        });
      }

      // Calculate complete initial score
      await this.recalculateLeadScore(String(lead._id), userId);

      const populated = await Lead.findById(lead._id)
        .populate('assignedTo', 'fullName email')
        .populate('createdBy', 'fullName email');

      return toLeadPublic(populated);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logLeadError('Error creating lead', error);
      throw new ApiError('Failed to create lead', 500);
    }
  }

  async getLeadById(id: string, userId: string, userRole?: string, organizationId?: string): Promise<ILeadPublic | null> {
    try {
      const query: Record<string, any> = {
        _id: id,
        deletedAt: null,
      };

      if (organizationId) {
        query.organizationId = organizationId;
      }

      if (userRole && userRole !== 'admin') {
        query.$or = [{ createdBy: userId }, { assignedTo: userId }];
      }

      const lead = await Lead.findOne(query).populate('assignedTo', 'fullName email').populate('createdBy', 'fullName email');

      if (!lead) {
        return null;
      }

      return toLeadPublic(lead);
    } catch (error) {
      logLeadError('Error fetching lead', error);
      throw new ApiError('Failed to fetch lead', 500);
    }
  }

  async getLeads(filter: ILeadFilter, userId: string, userRole?: string, organizationId?: string): Promise<PaginatedResponse<ILeadPublic>> {
    try {
      const page = filter.page ?? 1;
      const limit = filter.limit ?? 10;
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {
        deletedAt: null,
      };

      if (organizationId) {
        query.organizationId = organizationId;
      }

      if (userRole !== 'admin') {
        query.$and = query.$and || [];
        query.$and.push({ $or: [{ createdBy: userId }, { assignedTo: userId }] });
      }

      if (filter.status?.length) {
        query.status = { $in: filter.status };
      }

      if (filter.source?.length) {
        query.source = { $in: filter.source };
      }

      if (filter.assignedTo) {
        query.assignedTo = filter.assignedTo;
      }

      if (filter.search) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { name: { $regex: filter.search, $options: 'i' } },
            { email: { $regex: filter.search, $options: 'i' } },
          ],
        });
      }

      if (filter.dateFrom || filter.dateTo) {
        query.createdAt = {};
        if (filter.dateFrom) {
          query.createdAt.$gte = filter.dateFrom;
        }
        if (filter.dateTo) {
          query.createdAt.$lte = filter.dateTo;
        }
      }

      const sortField = this.getSortField(filter.sortBy ?? 'latest');
      const sortOrder = filter.sortBy === 'oldest' ? 1 : -1;

      const leads = await Lead.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .populate('assignedTo', 'fullName email')
        .populate('createdBy', 'fullName email')
        .lean();

      const total = await Lead.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        data: leads.map(toLeadPublic),
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
      logLeadError('Error fetching leads', error);
      throw new ApiError('Failed to fetch leads', 500);
    }
  }

  async updateLead(id: string, input: UpdateLeadInput, userId: string, userRole?: string, organizationId?: string): Promise<ILeadPublic> {
    try {
      const query: Record<string, any> = {
        _id: id,
        deletedAt: null,
      };

      if (organizationId) {
        query.organizationId = organizationId;
      }

      if (userRole !== 'admin') {
        query.$or = [{ createdBy: userId }, { assignedTo: userId }];
      }

      const lead = await Lead.findOne(query);

      if (!lead) {
        throw new ApiError('Lead not found', 404);
      }

      const oldStatus = lead.status;
      const oldAssignedTo = lead.assignedTo?.toString();

      Object.assign(lead, {
        ...input,
        assignedTo: input.assignedTo !== undefined ? (input.assignedTo ? input.assignedTo : null) : lead.assignedTo,
        phone: input.phone === '' ? undefined : (input.phone !== undefined ? input.phone : lead.phone),
      });

      await lead.save();

      // Log status changes on timeline
      if (input.status && input.status !== oldStatus) {
        await activityService.logActivity({
          leadId: id,
          actionType: 'status_changed',
          performedBy: userId,
          oldValue: oldStatus,
          newValue: input.status,
          metadata: { reason: 'Status manually updated' },
        });
      }

      // Log user assignments on timeline
      const newAssignedTo = lead.assignedTo?.toString();
      if (newAssignedTo !== oldAssignedTo) {
        await activityService.logActivity({
          leadId: id,
          actionType: 'assigned_to_user',
          performedBy: userId,
          oldValue: oldAssignedTo,
          newValue: newAssignedTo,
          metadata: { reason: 'Lead owner updated' },
        });
      }

      // Recalculate complete lead score
      await this.recalculateLeadScore(id, userId);

      logger.info(`Lead updated: ${lead._id} by user: ${userId}`);

      const updated = await Lead.findById(id)
        .populate('assignedTo', 'fullName email')
        .populate('createdBy', 'fullName email');

      return toLeadPublic(updated);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logLeadError('Error updating lead', error);
      throw new ApiError('Failed to update lead', 500);
    }
  }

  async deleteLead(id: string, userId: string, userRole?: string, organizationId?: string): Promise<void> {
    try {
      const query: Record<string, any> = {
        _id: id,
        deletedAt: null,
      };

      if (organizationId) {
        query.organizationId = organizationId;
      }

      if (userRole !== 'admin') {
        query.$or = [{ createdBy: userId }, { assignedTo: userId }];
      }

      const lead = await Lead.findOne(query);

      if (!lead) {
        throw new ApiError('Lead not found', 404);
      }

      lead.deletedAt = new Date();
      await lead.save();

      logger.info(`Lead soft deleted: ${lead._id} by user: ${userId}`);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logLeadError('Error deleting lead', error);
      throw new ApiError('Failed to delete lead', 500);
    }
  }

  private calculateInitialScore(source: string): number {
    const scores: Record<string, number> = {
      referral: 40,
      website: 20,
      instagram: 10,
      other: 5,
    };
    return scores[source.toLowerCase()] ?? 0;
  }

  private getSortField(sortBy: string): SortField {
    const fieldMap: Record<string, SortField> = {
      latest: 'createdAt',
      oldest: 'createdAt',
      score: 'leadScore',
    };
    return fieldMap[sortBy] ?? 'createdAt';
  }
}

export const leadService = new LeadService();
