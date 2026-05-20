import { Resend } from 'resend';
import { EmailTemplate } from '../models/EmailTemplate';
import { EmailHistory } from '../models/EmailHistory';
import { Lead } from '../models/Lead';
import { User } from '../models/User';
import { leadService } from './lead.service';
import { activityService } from './activity.service';
import { ApiError } from '../errors/ApiError';
import logger from '../config/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  async sendTemplatedEmail(leadId: string, templateId: string, userId: string) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new ApiError('Lead not found', 404);
      }

      const template = await EmailTemplate.findById(templateId);
      if (!template) {
        throw new ApiError('Email template not found', 404);
      }

      // Replace variables: e.g. {{name}} with lead's name
      let subject = template.subject;
      let body = template.body;

      const variablesMap: Record<string, string> = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        status: lead.status,
        source: lead.source,
      };

      Object.entries(variablesMap).forEach(([key, val]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        subject = subject.replace(regex, val);
        body = body.replace(regex, val);
      });

      // Fetch the sender to get their company name
      const sender = await User.findById(userId).populate<{ organizationId: { name: string } }>('organizationId');
      const companyName = sender?.organizationId?.name || 'ClickLeads';

      const { data, error } = await resend.emails.send({
        from: `${companyName} <hello@mail.keerthanpoojary.tech>`,
        to: [lead.email],
        subject,
        html: body,
      });

      if (error) {
        logger.error(`Resend Error: ${error.message}`);
        throw new ApiError(error.message, 500);
      }

      // Save email history entry
      const history = await EmailHistory.create({
        leadId: lead._id,
        templateId: template._id,
        recipientEmail: lead.email,
        subject,
        body,
        status: 'sent',
        sentBy: userId,
      });

      logger.info(`Real email sent to: ${lead.email} via template: ${template.name}, Resend ID: ${data?.id}`);

      // Log sent activity
      await activityService.logActivity({
        leadId: String(lead._id),
        actionType: 'email_sent',
        performedBy: userId,
        oldValue: undefined,
        newValue: template.name,
        metadata: {
          emailHistoryId: history._id,
          subject,
        },
      });

      // Update lead's lastContactedAt
      lead.lastContactedAt = new Date();
      await lead.save();

      // Recalculate lead score (+5 pts for email sent)
      await leadService.recalculateLeadScore(String(lead._id), userId);

      return history;
    } catch (error) {
      logger.error(`Error sending email: ${error}`);
      throw error;
    }
  }

  async sendCustomEmail(leadId: string, subject: string, body: string, userId: string) {
    try {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        throw new ApiError('Lead not found', 404);
      }

      // Fetch the sender to get their company name
      const sender = await User.findById(userId).populate<{ organizationId: { name: string } }>('organizationId');
      const companyName = sender?.organizationId?.name || 'ClickLeads';

      const { data, error } = await resend.emails.send({
        from: `${companyName} <hello@mail.keerthanpoojary.tech>`,
        to: [lead.email],
        subject,
        html: body,
      });

      if (error) {
        logger.error(`Resend Error: ${error.message}`);
        throw new ApiError(error.message, 500);
      }

      // Save email history entry
      const history = await EmailHistory.create({
        leadId: lead._id,
        recipientEmail: lead.email,
        subject,
        body,
        status: 'sent',
        sentBy: userId,
      });

      logger.info(`Custom email sent to: ${lead.email}, Resend ID: ${data?.id}`);

      // Log sent activity
      await activityService.logActivity({
        leadId: String(lead._id),
        actionType: 'email_sent',
        performedBy: userId,
        oldValue: undefined,
        newValue: 'Custom Email',
        metadata: {
          emailHistoryId: history._id,
          subject,
        },
      });

      // Update lead's lastContactedAt
      lead.lastContactedAt = new Date();
      await lead.save();

      // Recalculate lead score (+5 pts for email sent)
      await leadService.recalculateLeadScore(String(lead._id), userId);

      return history;
    } catch (error) {
      logger.error(`Error sending custom email: ${error}`);
      throw error;
    }
  }

  async mockOpenEmail(historyId: string, userId: string) {
    try {
      const history = await EmailHistory.findById(historyId);
      if (!history) {
        throw new ApiError('Email history not found', 404);
      }

      if (history.status === 'sent') {
        history.status = 'opened';
        history.openedAt = new Date();
        await history.save();

        logger.info(`Mock opened email for lead: ${history.leadId}`);

        // Log opened activity
        await activityService.logActivity({
          leadId: String(history.leadId),
          actionType: 'email_opened',
          performedBy: userId,
          newValue: history.subject,
          metadata: {
            emailHistoryId: history._id,
          },
        });

        // Recalculate lead score (+10 pts for email opened)
        await leadService.recalculateLeadScore(String(history.leadId), userId);
      }

      return history;
    } catch (error) {
      logger.error(`Error mock opening email: ${error}`);
      throw error;
    }
  }

  async mockClickEmail(historyId: string, userId: string) {
    try {
      const history = await EmailHistory.findById(historyId);
      if (!history) {
        throw new ApiError('Email history not found', 404);
      }

      if (history.status === 'sent' || history.status === 'opened') {
        history.status = 'clicked';
        history.clickedAt = new Date();
        if (!history.openedAt) {
          history.openedAt = new Date();
        }
        await history.save();

        logger.info(`Mock clicked email for lead: ${history.leadId}`);

        // Log clicked activity
        await activityService.logActivity({
          leadId: String(history.leadId),
          actionType: 'email_clicked',
          performedBy: userId,
          newValue: history.subject,
          metadata: {
            emailHistoryId: history._id,
          },
        });

        // Recalculate lead score (+15 pts for email clicked)
        await leadService.recalculateLeadScore(String(history.leadId), userId);
      }

      return history;
    } catch (error) {
      logger.error(`Error mock clicking email: ${error}`);
      throw error;
    }
  }

  async getEmailHistoryForLead(leadId: string) {
    try {
      return await EmailHistory.find({ leadId })
        .sort({ createdAt: -1 })
        .populate('sentBy', 'fullName email')
        .lean();
    } catch (error) {
      logger.error(`Error fetching email history: ${error}`);
      throw error;
    }
  }

  async sendTeamInviteEmail(targetEmail: string, inviteUrl: string, adminFullName: string, adminCompanyName: string, role: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${adminCompanyName} <hello@mail.keerthanpoojary.tech>`,
        to: [targetEmail],
        subject: `You have been invited to join ${adminFullName}'s Workspace`,
        html: `
          <h2>You're Invited!</h2>
          <p>${adminFullName} has invited you to join their workspace on ClickLeads as a ${role === 'admin' ? 'Administrator' : 'Sales Representative'}.</p>
          <p><a href="${inviteUrl}">Click here to accept the invitation and create your account</a>.</p>
          <p>Or copy this link into your browser: <br/> <a href="${inviteUrl}">${inviteUrl}</a></p>
          <p>This invite link will expire in 48 hours.</p>
        `,
      });

      if (error) {
        logger.error(`Resend API Error during invite: ${error.message}`);
        throw new ApiError('Failed to send invite email', 500);
      }
      return data;
    } catch (error) {
      logger.error(`Error sending team invite email: ${error}`);
      throw error;
    }
  }
}

export const emailService = new EmailService();
