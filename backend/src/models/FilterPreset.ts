import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import type { IFilterPreset } from '../interfaces/IFilterPreset';

export type FilterPresetDocument = HydratedDocument<IFilterPreset>;

const filterPresetSchema = new Schema<IFilterPreset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    } as any,
    name: {
      type: String,
      required: [true, 'Preset name is required'],
      trim: true,
    },
    filters: {
      type: Schema.Types.Mixed,
      required: [true, 'Filters object is required'],
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'filter_presets',
  },
);

export const FilterPreset: Model<IFilterPreset> = model<IFilterPreset>('FilterPreset', filterPresetSchema);
