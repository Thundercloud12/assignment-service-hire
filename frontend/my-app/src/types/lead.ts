export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost';
export type LeadSource = 'website' | 'instagram' | 'referral' | 'other';

export interface ILead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  leadScore: number;
  assignedTo?: string;
  createdBy: string;
  lastContactedAt?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ILeadFilter {
  status?: LeadStatus[];
  source?: LeadSource[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'latest' | 'oldest' | 'score';
  page?: number;
  limit?: number;
  assignedTo?: string;
}

export interface ILeadsResponse {
  data: ILead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
