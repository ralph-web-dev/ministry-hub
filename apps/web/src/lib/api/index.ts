import axios, { InternalAxiosRequestConfig } from 'axios';
import { API_PREFIX } from '@ministryhub/constants';

export const api = axios.create({
  baseURL: API_PREFIX,
  withCredentials: true, // for HTTP-only cookies
});

// Interceptor for attaching Authorization header if token exists in memory or localStorage
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
