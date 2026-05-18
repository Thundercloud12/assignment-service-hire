import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/ApiError';
import { leadService } from '../services/lead.service';

class LeadController {
  async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError('User not authenticated', 401);
      }

      const lead = await leadService.createLead(req.body, String(req.user.id), req.user.organizationId);

      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError('User not authenticated', 401);
      }

      const { status, source, search, dateFrom, dateTo, sortBy, page, limit, assignedTo } = req.query;

      const statusArray = status
        ? (Array.isArray(status) ? status : [status as string]).filter((s): s is string => typeof s === 'string')
        : undefined;

      const sourceArray = source
        ? (Array.isArray(source) ? source : [source as string]).filter((s): s is string => typeof s === 'string')
        : undefined;

      const filters = {
        status: statusArray as any,
        source: sourceArray as any,
        search: (search as string) ?? undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        sortBy: (sortBy as 'latest' | 'oldest' | 'score') ?? 'latest',
        page: parseInt((page as string) ?? '1', 10),
        limit: parseInt((limit as string) ?? '10', 10),
        assignedTo: typeof assignedTo === 'string' ? assignedTo : undefined,
      };

      const result = await leadService.getLeads(filters, req.user.id, req.user.role, req.user.organizationId);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError('User not authenticated', 401);
      }

      const { id } = req.params;
      const lead = await leadService.getLeadById(String(id), String(req.user.id), req.user.role, req.user.organizationId);

      if (!lead) {
        throw new ApiError('Lead not found', 404);
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError('User not authenticated', 401);
      }

      const { id } = req.params;
      const lead = await leadService.updateLead(String(id), req.body, String(req.user.id), req.user.role, req.user.organizationId);

      res.json({
        success: true,
        message: 'Lead updated successfully',
        data: lead,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ApiError('User not authenticated', 401);
      }

      const { id } = req.params;
      await leadService.deleteLead(String(id), String(req.user.id), req.user.role, req.user.organizationId);

      res.json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leadController = new LeadController();
