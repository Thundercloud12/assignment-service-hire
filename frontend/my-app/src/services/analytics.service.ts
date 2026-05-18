import apiClient from './api';
import type { IApiResponse } from '../types/auth';

export interface IAnalyticsData {
  kpis: {
    totalLeads: number;
    qualifiedLeads: number;
    contactedLeads: number;
    conversionRate: number;
    avgLeadScore: number;
  };
  statusDistribution: { status: string; count: number }[];
  sourceDistribution: { source: string; count: number }[];
  leadsOverTime: { date: string; count: number }[];
  assigneePerformance: {
    _id: string;
    count: number;
    fullName: string;
    email: string;
  }[];
}

export const analyticsService = {
  async getDashboardAnalytics(): Promise<IAnalyticsData> {
    const response = await apiClient.get<IApiResponse<IAnalyticsData>>('/analytics');
    return response.data.data!;
  },
};
