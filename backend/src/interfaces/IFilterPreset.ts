export interface IFilterPreset {
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
  createdAt: Date;
  updatedAt: Date;
}
