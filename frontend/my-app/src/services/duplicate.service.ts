import apiClient from './api';
import type { IApiResponse } from '../types/auth';

export interface IDuplicateGroup {
  field: 'email' | 'name';
  value: string;
  leads: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: string;
    source: string;
    leadScore: number;
    createdAt: string;
  }>;
}

export const duplicateService = {
  async scanDuplicates(): Promise<IDuplicateGroup[]> {
    const response = await apiClient.get<IApiResponse<IDuplicateGroup[]>>('/leads/duplicates/scan');
    return response.data.data ?? [];
  },

  async mergeLeads(primaryId: string, duplicateId: string): Promise<any> {
    const response = await apiClient.post<IApiResponse<any>>('/leads/duplicates/merge', {
      primaryId,
      duplicateId,
    });
    return response.data.data;
  },
};
