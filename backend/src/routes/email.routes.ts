import { Router } from 'express';
import { emailService } from '../services/email.service';
import { leadService } from '../services/lead.service';
import { EmailTemplate } from '../models/EmailTemplate';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware';
import { ApiError } from '../errors/ApiError';

export const emailRouter = Router();

emailRouter.use(authMiddleware);

// --- Email Template CRUD ---

// Get all email templates
emailRouter.get('/templates', async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find().populate('createdBy', 'fullName email').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
});

// Create an email template (Admin only)
emailRouter.post('/templates', authorizeRoles(['admin']), async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      throw new ApiError('Name, subject, and body are required fields', 400);
    }

    const variables: string[] = [];
    const varRegex = /{{\s*(\w+)\s*}}/g;
    let match;
    while ((match = varRegex.exec(body)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1].toLowerCase());
      }
    }

    const template = await EmailTemplate.create({
      name: name.trim(),
      subject: subject.trim(),
      body,
      variables: variables.length > 0 ? variables : ['name', 'email'],
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

// Update an email template (Admin only)
emailRouter.put('/templates/:id', authorizeRoles(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      throw new ApiError('Name, subject, and body are required fields', 400);
    }

    const variables: string[] = [];
    const varRegex = /{{\s*(\w+)\s*}}/g;
    let match;
    while ((match = varRegex.exec(body)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1].toLowerCase());
      }
    }

    const template = await EmailTemplate.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        subject: subject.trim(),
        body,
        variables: variables.length > 0 ? variables : ['name', 'email'],
      },
      { new: true }
    );

    if (!template) {
      throw new ApiError('Template not found', 404);
    }

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

// Delete an email template (Admin only)
emailRouter.delete('/templates/:id', authorizeRoles(['admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findByIdAndDelete(id);

    if (!template) {
      throw new ApiError('Template not found', 404);
    }

    res.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});


// --- Email Actions & Tracking ---

// Get email history logs for a lead
emailRouter.get('/history/:leadId', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }
    const { leadId } = req.params;

    const lead = await leadService.getLeadById(leadId, req.user.id, req.user.role, req.user.organizationId);
    if (!lead) {
      throw new ApiError('Lead not found or access denied', 404);
    }

    const history = await emailService.getEmailHistoryForLead(leadId);
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

// Send templated email to lead
emailRouter.post('/send/:leadId', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { leadId } = req.params;
    const { templateId } = req.body;

    if (!templateId) {
      throw new ApiError('Template ID is required', 400);
    }

    const lead = await leadService.getLeadById(leadId, req.user.id, req.user.role, req.user.organizationId);
    if (!lead) {
      throw new ApiError('Lead not found or access denied', 404);
    }

    const history = await emailService.sendTemplatedEmail(leadId, templateId, req.user.id);
    res.json({
      success: true,
      message: 'Email sent successfully (simulated)',
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

// Mock opened webhook
emailRouter.post('/history/:id/mock-open', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await emailService.mockOpenEmail(id, req.user.id);
    res.json({
      success: true,
      message: 'Email status updated to opened',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Mock clicked webhook
emailRouter.post('/history/:id/mock-click', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await emailService.mockClickEmail(id, req.user.id);
    res.json({
      success: true,
      message: 'Email status updated to clicked',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
