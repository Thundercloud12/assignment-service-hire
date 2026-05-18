import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import type { IUser } from '../interfaces/IUser';
import { USER_ROLES } from '../constants/auth.constants';

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [120, 'Full name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.SALES_USER,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: null,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    } as any,
  },
  {
    timestamps: true,
    collection: 'users',
  },
);


export const User: Model<IUser> = model<IUser>('User', userSchema);