import axios from 'axios';
import { supabase } from '../lib/supabase';

const baseURL = process.env.REACT_APP_API_BASE_URL;

if (!baseURL) {
  throw new Error('REACT_APP_API_BASE_URL is not configured');
}

export const apiClient = axios.create({
  baseURL: baseURL.replace(/\/+$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return Promise.reject(error);
  }

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      return Promise.reject(new Error('Сесія завершилася. Увійдіть знову.'));
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error('Недостатньо прав для цієї операції.'));
    }

    if (error.response) {
      const detail =
        error.response.data?.detail ||
        error.response.data?.message ||
        'Сервер відхилив запит.';

      return Promise.reject(new Error(detail));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Сервер не відповів вчасно.'));
    }

    return Promise.reject(new Error('Не вдалося підключитися до API.'));
  }
);
