import apiClient from './api';
import type { ILeadFilter } from '../types/lead';

export const csvService = {
  async exportLeads(filters: ILeadFilter): Promise<void> {
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
    if (filters.assignedTo) {
      params.append('assignedTo', filters.assignedTo);
    }
    
    const response = await apiClient.get(`/leads/csv/export?${params.toString()}`, {
      responseType: 'blob',
    });

    // Create virtual anchor link to download file
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async importLeads(leads: Array<{ name: string; email: string; phone?: string; status?: string; source?: string }>): Promise<any> {
    const response = await apiClient.post('/leads/csv/import', { leads });
    return response.data;
  },
};
