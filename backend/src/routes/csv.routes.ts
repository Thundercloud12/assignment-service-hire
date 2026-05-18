import { Router } from 'express';
import { csvService } from '../services/csv.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { ApiError } from '../errors/ApiError';

export const csvRouter = Router();

csvRouter.use(authMiddleware);

// Export active filtered leads as downloadable CSV file
csvRouter.get('/export', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    // Extract query filter parameters (similar to getLeads)
    const status = req.query.status ? (req.query.status as string).split(',') : undefined;
    const source = req.query.source ? (req.query.source as string).split(',') : undefined;
    const search = req.query.search as string || undefined;
    const assignedTo = req.query.assignedTo as string || undefined;
    const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
    const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

    const csvContent = await csvService.exportLeadsToCsv({
      status: status as any,
      source: source as any,
      search,
      assignedTo,
      dateFrom,
      dateTo,
    }, req.user.id, req.user.role, req.user.organizationId);

    // Set file response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=leads_export_${Date.now()}.csv`);
    
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

// Import bulk parsed leads from JSON body array
csvRouter.post('/import', async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError('User not authenticated', 401);
    }

    const { leads } = req.body;

    if (!leads || !Array.isArray(leads)) {
      throw new ApiError('An array of leads is required under the key "leads"', 400);
    }

    const result = await csvService.importLeads(leads, req.user.id, req.user.organizationId);

    res.status(200).json({
      success: true,
      message: `Import processed. ${result.importedCount} leads imported, ${result.duplicateCount} duplicate email(s) skipped.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});
