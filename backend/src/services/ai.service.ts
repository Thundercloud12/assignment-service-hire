import { Lead } from '../models/Lead';
import { Organization } from '../models/Organization';
import { EmailTemplate } from '../models/EmailTemplate';
import { Activity } from '../models/Activity';
import { ApiError } from '../errors/ApiError';
import { llmProvider } from './llm.provider';
import logger from '../config/logger';

class AIService {
  async generateEmailCopilot(leadId: string, organizationId: string, templateId?: string | null): Promise<string> {
    // 1. Fetch target lead and verify multi-tenant isolation bounds
    const lead = await Lead.findOne({ _id: leadId, deletedAt: null });
    if (!lead) {
      throw new ApiError('Lead not found or access denied', 404);
    }

    if (lead.organizationId.toString() !== organizationId) {
      throw new ApiError('Access denied: Lead record belongs to another workspace', 403);
    }

    // 2. Fetch organization workspace to resolve company branding name
    const org = await Organization.findById(organizationId).lean();
    const companyName = org?.name || 'our company';

    // 3. Query the latest 10 lead activities to assemble history metrics
    const activities = await Activity.find({ leadId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('performedBy', 'fullName email')
      .lean();

    const activityTimelineText = activities.length > 0
      ? activities
          .map(
            (a) =>
              `- [${new Date(a.createdAt).toLocaleDateString()}] ${a.actionType} performed by ${
                (a.performedBy as any)?.fullName || 'System'
              }${a.newValue ? ` (Updated to: ${a.newValue})` : ''}`
          )
          .join('\n')
      : 'No prior timeline activities registered for this lead.';

    // 4. Resolve Template layout formatting
    let templateSubject = 'N/A';
    let templateBody = 'N/A';

    if (templateId) {
      const template = await EmailTemplate.findById(templateId).lean();
      if (template) {
        templateSubject = template.subject;
        templateBody = template.body;
      }
    }

    // 5. Construct highly detailed System persona prompt
    const systemPrompt = `You are an elite enterprise sales executive and expert sales copywriter acting on behalf of "${companyName}".
Your objective is to draft a highly personalized, compelling, and structured sales email to engage and convert this lead.
Adhere to the following rules:
- Tone must be highly professional, polished, persuasive, and conversational.
- Act contextually as a representative of "${companyName}".
- Compose only the Subject Line and the Body content of the email.
- Do not output any chat preambles, introductory thoughts, bracketed placeholders (such as [insert name]), or assistant notes. The email must be immediately ready to be reviewed and dispatched by a sales representative.`;

    // 6. Construct rich User context prompt
    const userPrompt = `Draft a context-aware personalized email to the following contact:

--- RECIPIENT PROFILE ---
Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phone || 'N/A'}
Lead Pipeline Status: ${lead.status}
Initial Lead Source: ${lead.source}
Sender Company Representation: ${companyName}

--- OUTBOUND EMAIL TEMPLATE LAYOUT ---
${
  templateId && templateBody !== 'N/A'
    ? `Layout Subject Structure: ${templateSubject}
Layout Body Structure:
${templateBody}`
    : `No layout template selected. Formulate a personalized introductory outreach email highlighting the supreme benefits of partnering with ${companyName}.`
}

--- RECIPIENT TIMELINE ENGAGEMENT HISTORY ---
${activityTimelineText}

--- INSTRUCTIONS ---
Compose the email following the requested details. Integrate details from the lead's timeline history or source to demonstrate personalized attention and build rapport immediately. Use clean outline spacing:
Subject: [Compelling Subject Line]

Hi ${lead.name},
[Body Content]`;

    logger.info(`Assembling copilot prompts for lead ${lead.name} under workspace: ${companyName}`);

    // 7. Trigger the LLM Provider Gateway
    const generatedDraft = await llmProvider.generateText(systemPrompt, userPrompt);
    return generatedDraft;
  }
}

export const aiService = new AIService();
