import { Lead } from '../models/Lead';
import { Activity } from '../models/Activity';
import { EmailHistory } from '../models/EmailHistory';
import { leadService } from './lead.service';
import { activityService } from './activity.service';
import { ApiError } from '../errors/ApiError';
import mongoose from 'mongoose';

export class DuplicateService {
  /**
   * Scans leads and returns potential duplicate clusters grouped by Email or Name matches.
   */
  async findDuplicateGroups(userId: string, userRole?: string, organizationId?: string) {
    const leadFilter: Record<string, any> = { deletedAt: null };
    if (organizationId) {
      leadFilter.organizationId = new mongoose.Types.ObjectId(organizationId);
    }
    if (userRole !== 'admin') {
      leadFilter.createdBy = new mongoose.Types.ObjectId(userId);
    }

    // 1. Group duplicates by email
    const emailDuplicates = await Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$email' } } },
          count: { $sum: 1 },
          leads: { $push: '$$ROOT' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    // 2. Group duplicates by name (case-insensitive trim)
    const nameDuplicates = await Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: { $trim: { input: { $toLower: '$name' } } },
          count: { $sum: 1 },
          leads: { $push: '$$ROOT' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    // 3. Format response groupings
    const result: Array<{
      field: 'email' | 'name';
      value: string;
      leads: any[];
    }> = [];

    emailDuplicates.forEach((group) => {
      result.push({
        field: 'email',
        value: group._id,
        leads: group.leads.map((l: any) => ({
          id: l._id.toString(),
          name: l.name,
          email: l.email,
          phone: l.phone,
          status: l.status,
          source: l.source,
          leadScore: l.leadScore,
          createdAt: l.createdAt,
        })),
      });
    });

    nameDuplicates.forEach((group) => {
      // Avoid duplicate reports if already grouped by email matches
      const emailsInGroup = new Set(group.leads.map((l: any) => l.email.toLowerCase().trim()));
      const isAlreadyCovered = emailDuplicates.some((eg) => emailsInGroup.has(eg._id));

      if (!isAlreadyCovered) {
        result.push({
          field: 'name',
          value: group.leads[0].name,
          leads: group.leads.map((l: any) => ({
            id: l._id.toString(),
            name: l.name,
            email: l.email,
            phone: l.phone,
            status: l.status,
            source: l.source,
            leadScore: l.leadScore,
            createdAt: l.createdAt,
          })),
        });
      }
    });

    return result;
  }

  /**
   * Merges a duplicate lead into a primary lead, preserving timelines and custom properties.
   */
  async mergeLeads(primaryId: string, duplicateId: string, userId: string, userRole?: string, organizationId?: string) {
    if (primaryId === duplicateId) {
      throw new ApiError('Cannot merge a lead into itself', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(primaryId) || !mongoose.Types.ObjectId.isValid(duplicateId)) {
      throw new ApiError('Invalid lead ID format', 400);
    }

    const query: Record<string, any> = { deletedAt: null };
    if (organizationId) {
      query.organizationId = organizationId;
    }
    if (userRole !== 'admin') {
      query.createdBy = userId;
    }

    const primary = await Lead.findOne({ _id: primaryId, ...query });
    const duplicate = await Lead.findOne({ _id: duplicateId, ...query });

    if (!primary) {
      throw new ApiError('Primary lead not found', 404);
    }
    if (!duplicate) {
      throw new ApiError('Duplicate lead not found', 404);
    }

    // 1. Copy over missing basic properties
    let detailsMerged: string[] = [];

    if (!primary.phone && duplicate.phone) {
      primary.phone = duplicate.phone;
      detailsMerged.push('phone');
    }

    // Merge customFields
    const primaryFields = primary.customFields || {};
    const duplicateFields = duplicate.customFields || {};
    let fieldsAddedCount = 0;
    
    Object.keys(duplicateFields).forEach((key) => {
      if (primaryFields[key] === undefined || primaryFields[key] === null || primaryFields[key] === '') {
        primaryFields[key] = duplicateFields[key];
        fieldsAddedCount++;
      }
    });

    if (fieldsAddedCount > 0) {
      primary.customFields = primaryFields;
      detailsMerged.push(`${fieldsAddedCount} custom field(s)`);
    }

    // Preserve the oldest contacted date
    if (duplicate.lastContactedAt) {
      if (!primary.lastContactedAt || new Date(duplicate.lastContactedAt) < new Date(primary.lastContactedAt)) {
        primary.lastContactedAt = duplicate.lastContactedAt;
        detailsMerged.push('last contacted date');
      }
    }

    await primary.save();

    // 2. Re-assign activities (Timeline Logs) from duplicate to primary
    await Activity.updateMany(
      { leadId: duplicateId },
      { $set: { leadId: primaryId } }
    );

    // 3. Re-assign email histories from duplicate to primary
    await EmailHistory.updateMany(
      { leadId: duplicateId },
      { $set: { leadId: primaryId } }
    );

    // 4. Log a merge action Activity on the primary lead
    await activityService.logActivity({
      leadId: primaryId,
      actionType: 'note_added', // standard type
      performedBy: userId,
      newValue: `Merged duplicate lead "${duplicate.name}" (${duplicate.email}) into this lead. Properties recovered: ${detailsMerged.length > 0 ? detailsMerged.join(', ') : 'none'}.`,
      metadata: {
        mergedLeadId: duplicateId,
        mergedLeadEmail: duplicate.email,
        mergedLeadName: duplicate.name,
      },
    });

    // 5. Recalculate lead score since email histories and activities updated
    await leadService.recalculateLeadScore(primaryId, userId);

    // 6. Delete the duplicate lead (soft delete or hard delete; since it's merged, a hard delete is safe and keeps collection clean)
    await Lead.deleteOne({ _id: duplicateId });

    return {
      success: true,
      mergedInto: primaryId,
      deletedLead: duplicateId,
    };
  }
}

export const duplicateService = new DuplicateService();
