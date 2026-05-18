import { Schema, model, type Document, type Model } from 'mongoose';

export interface IEmailHistory extends Document {
  leadId: Schema.Types.ObjectId;
  templateId?: Schema.Types.ObjectId;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'sent' | 'failed' | 'opened' | 'clicked';
  sentBy: Schema.Types.ObjectId;
  openedAt?: Date;
  clickedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailHistorySchema = new Schema<IEmailHistory>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required'],
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate',
      default: undefined,
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Email body is required'],
    },
    status: {
      type: String,
      required: true,
      enum: ['sent', 'failed', 'opened', 'clicked'],
      default: 'sent',
      index: true,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who sent email is required'],
      index: true,
    },
    openedAt: {
      type: Date,
      default: undefined,
    },
    clickedAt: {
      type: Date,
      default: undefined,
    },
  },
  {
    timestamps: true,
    collection: 'email_history',
  }
);

emailHistorySchema.index({ leadId: 1, createdAt: -1 });

export const EmailHistory: Model<IEmailHistory> = model<IEmailHistory>('EmailHistory', emailHistorySchema);
