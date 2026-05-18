import type { IApiResponse, IAuthResponse, ILoginInput, IRegisterInput, IUser } from '../types/auth';
import apiClient from './api';

export const authService = {
  async register(input: IRegisterInput): Promise<IAuthResponse> {
    const response = await apiClient.post<IApiResponse<IAuthResponse>>('/auth/register', input);
    return response.data.data!;
  },

  async login(input: ILoginInput): Promise<IAuthResponse> {
    const response = await apiClient.post<IApiResponse<IAuthResponse>>('/auth/login', input);
    return response.data.data!;
  },

  async refreshToken(refreshToken: string): Promise<IAuthResponse> {
    const response = await apiClient.post<IApiResponse<IAuthResponse>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data!;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data.data;
  },

  async getUsers() {
    const response = await apiClient.get<IApiResponse<IUser[]>>('/auth/users');
    return response.data.data ?? [];
  },
};
