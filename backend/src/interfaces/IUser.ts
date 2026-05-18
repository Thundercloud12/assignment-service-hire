import type { UserRole } from '../constants/auth.constants';

export interface IUser {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthTokenPayload {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: IUserPublic;
  tokens: IAuthTokens;
}