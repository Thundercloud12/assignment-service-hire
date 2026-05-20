import apiClient from './api';
import type { IApiResponse } from '../types/auth';

export const aiService = {
  async generateEmailDraft(leadId: string, templateId?: string | null): Promise<string> {
    const response = await apiClient.post<any>('/ai/generate-email', {
      leadId,
      templateId: templateId || undefined,
    });
    return response.data.emailDraft || '';
  },
};
