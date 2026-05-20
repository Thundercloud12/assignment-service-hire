import { Schema, model, type Document, type Model } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Template subject is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Template body is required'],
    },
    variables: {
      type: [String],
      default: ['name', 'email'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
  },
  {
    timestamps: true,
    collection: 'email_templates',
  }
);

export const EmailTemplate: Model<IEmailTemplate> = model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);
