import { z } from 'zod';
import type { LeadStatus, LeadSource } from '../interfaces/ILead';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost'] as const;
const LEAD_SOURCES = ['website', 'instagram', 'referral', 'other'] as const;

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().optional().nullable().or(z.literal('')),
  status: z.enum(LEAD_STATUSES).optional().default('new' as const),
  source: z.enum(LEAD_SOURCES),
  assignedTo: z.string().optional().nullable().or(z.literal('')),
  customFields: z.record(z.unknown()).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  phone: z.string().trim().optional().nullable().or(z.literal('')),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assignedTo: z.string().optional().nullable().or(z.literal('')),
  customFields: z.record(z.unknown()).optional(),
});

export const filterLeadsSchema = z.object({
  status: z.string().or(z.array(z.string())).optional(),
  source: z.string().or(z.array(z.string())).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['latest', 'oldest', 'score']).optional().default('latest' as const),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  assignedTo: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type FilterLeadsInput = z.infer<typeof filterLeadsSchema>;
