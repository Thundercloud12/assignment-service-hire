export interface IUser {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'sales_user';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: IUser;
  tokens: IAuthTokens;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRegisterInput {
  fullName: string;
  email: string;
  password: string;
  role?: 'admin' | 'sales_user';
  avatarUrl?: string;
  companyName?: string;
  inviteToken?: string;
}

export interface IApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { field: string; message: string }[];
}
