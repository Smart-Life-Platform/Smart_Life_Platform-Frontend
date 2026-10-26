import axios from 'axios';
import { supabase } from '../lib/supabase';

const baseURL = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) return Promise.reject(error);

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      supabase.auth.signOut().finally(() => {
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      });
      return Promise.reject(new Error('Сесія завершилася. Перенаправлення на сторінку входу.'));
    }
    if (status === 403) return Promise.reject(new Error('Недостатньо прав для цієї операції.'));
    if (error.response) {
      return Promise.reject(new Error(error.response.data?.error || error.response.data?.detail || 'Сервер відхилив запит.'));
    }
    return Promise.reject(new Error('Не вдалося підключитися до API.'));
  }
);
