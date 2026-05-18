import apiClient from './api';
import type { IApiResponse } from '../types/auth';

export interface IFilterPreset {
  _id: string;
  userId: string;
  name: string;
  filters: {
    status?: string[];
    source?: string[];
    search?: string;
    sortBy?: string;
    assignedTo?: string;
  };
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const presetService = {
  async getPresets(): Promise<IFilterPreset[]> {
    const response = await apiClient.get<IApiResponse<IFilterPreset[]>>('/filter-presets');
    return response.data.data ?? [];
  },

  async savePreset(name: string, filters: any, isFavorite = false): Promise<IFilterPreset> {
    const response = await apiClient.post<IApiResponse<IFilterPreset>>('/filter-presets', {
      name,
      filters,
      isFavorite,
    });
    return response.data.data!;
  },

  async deletePreset(id: string): Promise<void> {
    await apiClient.delete(`/filter-presets/${id}`);
  },
};
