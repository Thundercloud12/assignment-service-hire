import { Lead } from '../models/Lead';
import type { ILeadFilter } from '../interfaces/ILead';
import { leadService } from './lead.service';
import { ApiError } from '../errors/ApiError';

export class CsvService {
  /**
   * Generates a CSV text block of leads matching the active filter query (without pagination bounds).
   */
  async exportLeadsToCsv(filter: ILeadFilter, userId: string, userRole?: string, organizationId?: string): Promise<string> {
    const query: Record<string, any> = {
      deletedAt: null,
    };

    if (organizationId) {
      query.organizationId = organizationId;
    }

    if (userRole !== 'admin') {
      query.createdBy = userId;
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
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.dateFrom || filter.dateTo) {
      query.createdAt = {};
      if (filter.dateFrom) {
        query.createdAt.$gte = new Date(filter.dateFrom);
      }
      if (filter.dateTo) {
        query.createdAt.$lte = new Date(filter.dateTo);
      }
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'fullName email')
      .lean();

    // CSV Headers
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Lead Score', 'Assigned To', 'Created At'];
    
    const escapeCsvValue = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      return str;
    };

    const rows = leads.map((lead: any) => [
      escapeCsvValue(lead.name),
      escapeCsvValue(lead.email),
      escapeCsvValue(lead.phone),
      escapeCsvValue(lead.status),
      escapeCsvValue(lead.source),
      escapeCsvValue(lead.leadScore),
      escapeCsvValue(lead.assignedTo?.fullName ?? 'Unassigned'),
      escapeCsvValue(new Date(lead.createdAt).toISOString()),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Imports a parsed JSON list of leads into the database.
   */
  async importLeads(leads: Array<{ name: string; email: string; phone?: string; status?: string; source?: string }>, userId: string, organizationId?: string) {
    let importedCount = 0;
    let duplicateCount = 0;
    const insertedLeads: any[] = [];

    for (const leadInput of leads) {
      // 1. Basic checks
      if (!leadInput.name || !leadInput.email) {
        continue;
      }

      const email = leadInput.email.toLowerCase().trim();

      // 2. Scan duplicates owned by this organization
      const existing = await Lead.findOne({
        email,
        organizationId,
        deletedAt: null,
      });

      if (existing) {
        duplicateCount++;
        continue;
      }

      // 3. Normalize values
      const status = (leadInput.status?.toLowerCase().trim() || 'new') as any;
      const source = (leadInput.source?.toLowerCase().trim() || 'other') as any;

      // 4. Create Lead using leadService to handle timeline creation logs and scoring engine trigger
      try {
        const newLead = await leadService.createLead({
          name: leadInput.name.trim(),
          email,
          phone: leadInput.phone?.trim() || undefined,
          status,
          source,
        }, userId, organizationId);

        insertedLeads.push(newLead);
        importedCount++;
      } catch (err) {
        // Skip individual errors to process bulk safely
        console.error('Failed to import single lead:', err);
      }
    }

    return {
      importedCount,
      duplicateCount,
      insertedLeads,
    };
  }
}

export const csvService = new CsvService();
