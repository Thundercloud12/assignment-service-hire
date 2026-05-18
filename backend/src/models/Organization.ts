import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import type { IOrganization } from '../interfaces/IOrganization';

export type OrganizationDocument = HydratedDocument<IOrganization>;

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'organizations',
  }
);

export const Organization: Model<IOrganization> = model<IOrganization>('Organization', organizationSchema);
