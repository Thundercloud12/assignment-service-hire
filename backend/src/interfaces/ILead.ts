export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';
export type LeadSource = 'website' | 'instagram' | 'referral' | 'other';

export interface ILead {
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  leadScore: number;
  assignedTo?: string | null;
  createdBy: string;
  organizationId: string;
  lastContactedAt?: Date | null;
  customFields?: Record<string, unknown>;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadPublic {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  leadScore: number;
  assignedTo?: string | null;
  createdBy: string;
  organizationId: string;
  lastContactedAt?: Date | null;
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeadFilter {
  status?: LeadStatus[];
  source?: LeadSource[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'latest' | 'oldest' | 'score';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  assignedTo?: string;
}
