import type { NextFunction, Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { ApiError } from '../errors/ApiError';
import logger from '../config/logger';

class AIController {
  generateEmailDraftHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError('User identity not authenticated', 401);
      }

      const { leadId, templateId } = req.body;
      const organizationId = req.user.organizationId;

      if (!organizationId) {
        throw new ApiError('Workspace identifier is missing from authentication credentials', 400);
      }

      logger.info(`AI Copilot draft requested for Lead ID: ${leadId} inside Workspace ID: ${organizationId}`);

      const emailDraft = await aiService.generateEmailCopilot(leadId, organizationId, templateId);

      res.status(200).json({
        success: true,
        emailDraft,
      });
    } catch (error) {
      logger.error(`Error in generateEmailDraftHandler: ${error}`);
      next(error);
    }
  };
}

export const aiController = new AIController();
