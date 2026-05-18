import type { ILead, ILeadFilter, ILeadsResponse } from '../types/lead';
import type { IApiResponse } from '../types/auth';
import apiClient from './api';

interface ILeadsApiResponse {
  success: boolean;
  data?: ILead[];
  pagination?: ILeadsResponse['pagination'];
}

export const leadService = {
  async getLeads(filters: ILeadFilter): Promise<ILeadsResponse> {
    const params = new URLSearchParams();

    if (filters.status?.length) {
      filters.status.forEach((s) => params.append('status', s));
    }
    if (filters.source?.length) {
      filters.source.forEach((s) => params.append('source', s));
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.page) {
      params.append('page', String(filters.page));
    }
    if (filters.limit) {
      params.append('limit', String(filters.limit));
    }

    const response = await apiClient.get<ILeadsApiResponse>(`/leads?${params.toString()}`);

    return {
      data: response.data.data ?? [],
      pagination: response.data.pagination ?? {
        page: 1,
        limit: filters.limit ?? 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  async getLeadById(id: string): Promise<ILead> {
    const response = await apiClient.get<IApiResponse<ILead>>(`/leads/${id}`);
    return response.data.data!;
  },

  async createLead(data: Partial<ILead>): Promise<ILead> {
    const response = await apiClient.post<IApiResponse<ILead>>('/leads', data);
    return response.data.data!;
  },

  async updateLead(id: string, data: Partial<ILead>): Promise<ILead> {
    const response = await apiClient.put<IApiResponse<ILead>>(`/leads/${id}`, data);
    return response.data.data!;
  },

  async deleteLead(id: string): Promise<void> {
    await apiClient.delete(`/leads/${id}`);
  },
};
