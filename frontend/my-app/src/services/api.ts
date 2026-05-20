import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useNotificationStore } from '../store/notification.store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Extend config to store the timer ID
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  coldStartTimerId?: number | ReturnType<typeof setTimeout>;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 70000, // 70 seconds to allow for Render hibernation wake-up
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Start a 10-second timer to detect cold starts
    config.coldStartTimerId = setTimeout(() => {
      const addToast = useNotificationStore.getState().addToast;
      addToast('Server is waking up from hibernation. This may take up to 60 seconds. Please wait...', 'info');
    }, 10000);

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    // Clear timer if request succeeds
    const config = response.config as CustomAxiosRequestConfig;
    if (config.coldStartTimerId) {
      clearTimeout(config.coldStartTimerId as number);
    }
    return response;
  },
  (error) => {
    // Clear timer if request fails
    const config = error.config as CustomAxiosRequestConfig;
    if (config?.coldStartTimerId) {
      clearTimeout(config.coldStartTimerId as number);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
