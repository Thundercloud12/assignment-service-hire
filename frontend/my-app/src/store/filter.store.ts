import { create } from 'zustand';
import type { ILeadFilter } from '../types/lead';

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FilterState extends ILeadFilter {
  pagination?: PaginationMetadata;
  setFilters: (filters: Partial<ILeadFilter>) => void;
  setPagination: (pagination: PaginationMetadata) => void;
  resetFilters: () => void;
}

const defaultFilters: ILeadFilter = {
  status: [],
  source: [],
  search: '',
  sortBy: 'latest',
  page: 1,
  limit: 10,
};

const defaultPagination: PaginationMetadata = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultFilters,
  pagination: defaultPagination,
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  setPagination: (pagination) => set({ pagination }),
  resetFilters: () =>
    set({
      ...defaultFilters,
      pagination: defaultPagination,
    }),
}));
