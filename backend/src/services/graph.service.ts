import mongoose from 'mongoose';
import { Lead } from '../models/Lead';
import { Activity } from '../models/Activity';
import { EmailHistory } from '../models/EmailHistory';
import { ApiError } from '../errors/ApiError';
import logger from '../config/logger';

class GraphService {
  async getNetworkGraphData(userId: string, userRole?: string) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const query: Record<string, any> = { deletedAt: null };

      if (userRole !== 'admin') {
        query.createdBy = userObjectId;
      }

      const leads = await Lead.find(query)
        .populate('assignedTo', 'fullName email')
        .populate('createdBy', 'fullName email');

      const nodes: any[] = [];
      const edges: any[] = [];
      const addedNodeIds = new Set<string>();

      // Group sources to limit total source nodes to 4 standard ones
      const standardSources = ['website', 'instagram', 'referral', 'other'];

      leads.forEach((lead) => {
        const leadId = `lead-${lead._id}`;

        // 1. Add Lead Node
        if (!addedNodeIds.has(leadId)) {
          nodes.push({
            id: leadId,
            label: lead.name,
            type: 'lead',
            group: lead.status,
            size: 24 + Math.min(lead.leadScore / 4, 16),
            score: lead.leadScore,
            email: lead.email,
            phone: lead.phone || 'None',
          });
          addedNodeIds.add(leadId);
        }

        // 2. Extract Company Node from Email Domain or Custom Fields
        let companyName = '';
        if (lead.customFields && typeof lead.customFields === 'object') {
          const fields = lead.customFields as Record<string, any>;
          companyName = fields.company || fields.Company || '';
        }

        if (!companyName && lead.email) {
          const emailParts = lead.email.split('@');
          if (emailParts.length === 2) {
            const domain = emailParts[1].toLowerCase();
            const genericDomains = [
              'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
              'icloud.com', 'aol.com', 'zoho.com', 'protonmail.com',
              'mail.com', 'yandex.com', 'proton.me'
            ];
            if (!genericDomains.includes(domain)) {
              companyName = domain;
            }
          }
        }

        if (companyName) {
          const companyId = `company-${companyName.replace(/\s+/g, '-').toLowerCase()}`;
          if (!addedNodeIds.has(companyId)) {
            nodes.push({
              id: companyId,
              label: companyName,
              type: 'company',
              group: 'company',
              size: 32,
            });
            addedNodeIds.add(companyId);
          }

          edges.push({
            id: `edge-${leadId}-${companyId}`,
            from: leadId,
            to: companyId,
            label: 'works at',
            weight: 2,
          });
        }

        // 3. Add Source Node
        const sourceName = lead.source || 'other';
        const sourceId = `source-${sourceName}`;
        if (!addedNodeIds.has(sourceId)) {
          nodes.push({
            id: sourceId,
            label: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
            type: 'source',
            group: 'source',
            size: 24,
          });
          addedNodeIds.add(sourceId);
        }

        edges.push({
          id: `edge-${leadId}-${sourceId}`,
          from: leadId,
          to: sourceId,
          label: 'acquired via',
          weight: 1.5,
        });

        // 4. Mapped Referral Chains
        let referredByName = '';
        if (lead.customFields && typeof lead.customFields === 'object') {
          const fields = lead.customFields as Record<string, any>;
          referredByName = fields.referredBy || fields.referrer || '';
        }

        if (referredByName) {
          const referrerId = `referrer-${referredByName.replace(/\s+/g, '-').toLowerCase()}`;
          if (!addedNodeIds.has(referrerId)) {
            nodes.push({
              id: referrerId,
              label: referredByName,
              type: 'referrer',
              group: 'referrer',
              size: 26,
            });
            addedNodeIds.add(referrerId);
          }

          edges.push({
            id: `edge-${leadId}-${referrerId}`,
            from: leadId,
            to: referrerId,
            label: 'referred by',
            weight: 2,
          });
        }
      });

      return { nodes, edges };
    } catch (error) {
      logger.error(`Error generating network graph: ${error}`);
      throw error;
    }
  }

  async getScoreInfluencerGraphData(leadId: string, userId: string, userRole?: string) {
    try {
      const leadObjectId = new mongoose.Types.ObjectId(leadId);
      const query: Record<string, any> = { _id: leadObjectId, deletedAt: null };

      if (userRole !== 'admin') {
        query.createdBy = new mongoose.Types.ObjectId(userId);
      }

      const lead = await Lead.findOne(query);
      if (!lead) {
        throw new ApiError('Lead not found or access denied', 404);
      }

      // 1. Calculate Source Component
      const sourceScores: Record<string, number> = {
        referral: 40,
        website: 20,
        instagram: 10,
        other: 5,
      };
      const sourceScore = sourceScores[lead.source.toLowerCase()] ?? 0;

      // 2. Engagement Component Factors
      let statusBonus = 0;
      if (lead.status !== 'new') {
        statusBonus = 20;
      }

      // Count engagement activities
      const emailHistories = await EmailHistory.find({ leadId: lead._id });
      const emailSentCount = emailHistories.length;
      const emailOpenCount = emailHistories.filter((eh) => eh.openedAt).length;
      const emailClickCount = emailHistories.filter((eh) => eh.clickedAt).length;

      const activityNotesCount = await Activity.countDocuments({
        leadId: lead._id,
        actionType: 'note_added',
      });

      const emailSentPoints = emailSentCount * 5;
      const emailOpenPoints = emailOpenCount * 10;
      const emailClickPoints = emailClickCount * 15;
      const notePoints = Math.min(activityNotesCount * 5, 30);

      const rawEngagementScore = statusBonus + emailSentPoints + emailOpenPoints + emailClickPoints + notePoints;
      const engagementScore = Math.min(rawEngagementScore, 100);

      // 3. Recency Component Factors
      let recencyScore = 5;
      if (lead.lastContactedAt) {
        const daysSinceContact = Math.max(
          0,
          Math.floor((Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
        );
        if (daysSinceContact <= 1) recencyScore = 50;
        else if (daysSinceContact <= 3) recencyScore = 40;
        else if (daysSinceContact <= 7) recencyScore = 30;
        else if (daysSinceContact <= 14) recencyScore = 15;
      }

      const calculatedScore = Math.min(
        Math.max(Math.round((sourceScore + engagementScore + recencyScore) / 3), 0),
        100
      );

      // Construct Node Link data centered around Lead
      const centralLeadId = `lead-${lead._id}`;
      const nodes: any[] = [
        {
          id: centralLeadId,
          label: lead.name,
          type: 'lead',
          group: lead.status,
          size: 45,
          score: calculatedScore,
        },
      ];
      const edges: any[] = [];

      // Source Factor
      if (sourceScore > 0) {
        const nodeId = 'factor-source';
        nodes.push({
          id: nodeId,
          label: `Source: ${lead.source.toUpperCase()} (+${sourceScore} pts)`,
          type: 'source-factor',
          group: 'positive',
          size: 26,
          weight: sourceScore,
        });
        edges.push({
          from: nodeId,
          to: centralLeadId,
          weight: sourceScore / 10,
          type: 'positive',
        });
      }

      // Recency Factor
      const nodeIdRecency = 'factor-recency';
      nodes.push({
        id: nodeIdRecency,
        label: lead.lastContactedAt 
          ? `Recency Score (+${recencyScore} pts)` 
          : `Not yet contacted (+${recencyScore} pts)`,
        type: 'recency-factor',
        group: recencyScore >= 30 ? 'positive' : 'neutral',
        size: 26,
        weight: recencyScore,
      });
      edges.push({
        from: nodeIdRecency,
        to: centralLeadId,
        weight: recencyScore / 10,
        type: recencyScore >= 30 ? 'positive' : 'neutral',
      });

      // Engagement Sub-Factors (Funnel status)
      if (statusBonus > 0) {
        const nodeId = 'sub-funnel';
        nodes.push({
          id: nodeId,
          label: `Funnel: ${lead.status.toUpperCase()} (+${statusBonus} pts)`,
          type: 'engagement-factor',
          group: 'positive',
          size: 24,
          weight: statusBonus,
        });
        edges.push({
          from: nodeId,
          to: centralLeadId,
          weight: statusBonus / 10,
          type: 'positive',
        });
      }

      // Engagement: Notes Added
      if (notePoints > 0) {
        const nodeId = 'sub-notes';
        nodes.push({
          id: nodeId,
          label: `Notes Added: ${activityNotesCount} (+${notePoints} pts)`,
          type: 'engagement-factor',
          group: 'positive',
          size: 24,
          weight: notePoints,
        });
        edges.push({
          from: nodeId,
          to: centralLeadId,
          weight: notePoints / 10,
          type: 'positive',
        });
      }

      // Engagement: Email Interactions
      const emailsCombinedPoints = emailSentPoints + emailOpenPoints + emailClickPoints;
      if (emailsCombinedPoints > 0) {
        const nodeId = 'sub-emails';
        nodes.push({
          id: nodeId,
          label: `Emails: ${emailSentCount} Sent, ${emailOpenCount} Opened, ${emailClickCount} Clicked (+${emailsCombinedPoints} pts)`,
          type: 'engagement-factor',
          group: 'positive',
          size: 24,
          weight: emailsCombinedPoints,
        });
        edges.push({
          from: nodeId,
          to: centralLeadId,
          weight: Math.min(emailsCombinedPoints / 10, 8),
          type: 'positive',
        });
      }

      return {
        scoreBreakdown: {
          sourceScore,
          engagementScore,
          recencyScore,
          calculatedScore,
        },
        nodes,
        edges,
      };
    } catch (error) {
      logger.error(`Error deconstructing lead score graph: ${error}`);
      throw error;
    }
  }
}

export const graphService = new GraphService();
export default graphService;
