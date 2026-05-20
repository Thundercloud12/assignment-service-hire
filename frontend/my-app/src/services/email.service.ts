import apiClient from './api';
import type { IApiResponse } from '../types/auth';

export interface IEmailTemplate {
  _id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IEmailHistoryData {
  _id: string;
  leadId: string;
  templateId?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'opened' | 'clicked';
  sentBy: {
    _id: string;
    fullName: string;
    email: string;
  };
  openedAt?: string;
  clickedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const emailService = {
  // Templates CRUD
  async getTemplates(): Promise<IEmailTemplate[]> {
    const response = await apiClient.get<IApiResponse<IEmailTemplate[]>>('/emails/templates');
    return response.data.data ?? [];
  },

  async createTemplate(data: { name: string; subject: string; body: string }): Promise<IEmailTemplate> {
    const response = await apiClient.post<IApiResponse<IEmailTemplate>>('/emails/templates', data);
    return response.data.data!;
  },

  async updateTemplate(id: string, data: { name: string; subject: string; body: string }): Promise<IEmailTemplate> {
    const response = await apiClient.put<IApiResponse<IEmailTemplate>>(`/emails/templates/${id}`, data);
    return response.data.data!;
  },

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/emails/templates/${id}`);
  },

  // Actions
  async getEmailHistory(leadId: string): Promise<IEmailHistoryData[]> {
    const response = await apiClient.get<IApiResponse<IEmailHistoryData[]>>(`/emails/history/${leadId}`);
    return response.data.data ?? [];
  },

  async sendEmail(leadId: string, templateId: string): Promise<IEmailHistoryData> {
    const response = await apiClient.post<IApiResponse<IEmailHistoryData>>(`/emails/send/${leadId}`, { templateId });
    return response.data.data!;
  },

  async sendCustomEmail(leadId: string, subject: string, body: string): Promise<IEmailHistoryData> {
    const response = await apiClient.post<IApiResponse<IEmailHistoryData>>(`/emails/send-custom/${leadId}`, { subject, body });
    return response.data.data!;
  },

  async mockOpenEmail(historyId: string): Promise<IEmailHistoryData> {
    const response = await apiClient.post<IApiResponse<IEmailHistoryData>>(`/emails/history/${historyId}/mock-open`);
    return response.data.data!;
  },

  async mockClickEmail(historyId: string): Promise<IEmailHistoryData> {
    const response = await apiClient.post<IApiResponse<IEmailHistoryData>>(`/emails/history/${historyId}/mock-click`);
    return response.data.data!;
  },
};
