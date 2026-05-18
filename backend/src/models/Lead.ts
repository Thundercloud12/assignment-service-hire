import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import type { ILead, LeadStatus, LeadSource } from '../interfaces/ILead';

export type LeadDocument = HydratedDocument<ILead>;

const LEAD_STATUS: readonly LeadStatus[] = ['new', 'contacted', 'qualified', 'lost'];
const LEAD_SOURCE: readonly LeadSource[] = ['website', 'instagram', 'referral', 'other'];

const leadSchema = new Schema<ILead>(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      minlength: [2, 'Lead name must be at least 2 characters'],
      maxlength: [100, 'Lead name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: undefined,
    },
    status: {
      type: String,
      enum: {
        values: LEAD_STATUS as unknown as string[],
        message: 'Invalid lead status',
      },
      default: 'new',
      index: true,
    },
    source: {
      type: String,
      enum: {
        values: LEAD_SOURCE as unknown as string[],
        message: 'Invalid lead source',
      },
      required: [true, 'Lead source is required'],
      index: true,
    },
    leadScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    } as any,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
      index: true,
    } as any,
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    } as any,
    lastContactedAt: {
      type: Date,
      default: null,
    },
    customFields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'leads',
  },
);

leadSchema.index({ email: 1, organizationId: 1 }, { unique: true, sparse: true });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, source: 1 });
leadSchema.index({ leadScore: -1 });

leadSchema.pre(/^find/, function (this: any) {
  if (!this.getOptions().includeSoftDeleted) {
    this.where({ deletedAt: null });
  }
});

export const Lead: Model<ILead> = model<ILead>('Lead', leadSchema);
