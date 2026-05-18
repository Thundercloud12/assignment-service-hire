import { Schema, model, type Document, type Model } from 'mongoose';

export interface IActivity extends Document {
  leadId: Schema.Types.ObjectId;
  actionType: 'status_changed' | 'email_sent' | 'email_opened' | 'email_clicked' | 'note_added' | 'assigned_to_user' | 'score_updated';
  oldValue?: string;
  newValue?: string;
  performedBy: Schema.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required'],
      index: true,
    },
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      enum: [
        'status_changed',
        'email_sent',
        'email_opened',
        'email_clicked',
        'note_added',
        'assigned_to_user',
        'score_updated',
      ],
      index: true,
    },
    oldValue: {
      type: String,
      default: undefined,
    },
    newValue: {
      type: String,
      default: undefined,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who performed action is required'],
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'activities',
  }
);

activitySchema.index({ leadId: 1, createdAt: -1 });

export const Activity: Model<IActivity> = model<IActivity>('Activity', activitySchema);
