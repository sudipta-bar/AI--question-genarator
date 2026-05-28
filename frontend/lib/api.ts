import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

interface RetryConfig extends InternalAxiosRequestConfig { _retry?: boolean }
type QueueEntry = { resolve: (token: string) => void; reject: (error: unknown) => void };

let isRefreshing = false;
let queue: QueueEntry[] = [];
const apiBaseURL = process.env.NEXT_PUBLIC_API_URL || undefined;

const refreshClient = axios.create({ baseURL: apiBaseURL, withCredentials: true });

function processQueue(error: unknown, token?: string) {
  queue.forEach((entry) => (error ? entry.reject(error) : entry.resolve(token ?? '')));
  queue = [];
}

export const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const original = error.config as RetryConfig | undefined;
    if (!original || error.response?.status !== 401 || error.response.data?.code !== 'TOKEN_EXPIRED' || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }
    isRefreshing = true;
    try {
      const { data } = await refreshClient.post<{ accessToken: string }>('/api/auth/refresh');
      useAuthStore.getState().setAccessToken(data.accessToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError);
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const plainApi = refreshClient;
