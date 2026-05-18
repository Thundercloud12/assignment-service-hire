import apiClient from './api';
import type { IApiResponse } from '../types/auth';

export interface IActivityData {
  _id: string;
  leadId: string;
  actionType: 'status_changed' | 'email_sent' | 'email_opened' | 'email_clicked' | 'note_added' | 'assigned_to_user' | 'score_updated';
  oldValue?: string;
  newValue?: string;
  performedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IActivityResponse {
  data: IActivityData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const activityService = {
  async getActivities(leadId: string, page = 1, limit = 10): Promise<IActivityResponse> {
    const response = await apiClient.get<IApiResponse<IActivityData[]>>(`/activities/${leadId}?page=${page}&limit=${limit}`);
    return {
      data: response.data.data ?? [],
      pagination: (response.data as any).pagination ?? {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  },

  async addNote(leadId: string, note: string): Promise<IActivityData> {
    const response = await apiClient.post<IApiResponse<IActivityData>>(`/activities/${leadId}`, { note });
    return response.data.data!;
  },
};
