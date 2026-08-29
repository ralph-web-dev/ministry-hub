import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_PREFIX } from '@ministryhub/constants';
import { toast } from '@/components/ui/Toast';

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';

export const api = axios.create({
  baseURL: apiUrl ? `${apiUrl}${API_PREFIX}` : API_PREFIX,
  withCredentials: true, // for HTTP-only cookies
});

// Interceptor for attaching Authorization header if token exists
let accessToken = localStorage.getItem('ministryhub_token') || '';

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('ministryhub_token', token);
  } else {
    localStorage.removeItem('ministryhub_token');
  }
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for handling 401 (Session Expired) and 429 (Rate Limiting)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Handle 401 Unauthorized / Session Expired
    if (status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        setAccessToken('');
        toast.error('Session expired. Please sign in.');
        window.location.href = '/login?expired=true';
      }
    }

    // Handle 429 Rate Limiting
    if (status === 429) {
      const message = data?.message || 'Too many requests. Please wait a moment.';
      toast.error(message);
    }

    return Promise.reject(error);
  },
);
