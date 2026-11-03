import axios from 'axios';
import { supabase } from '../lib/supabase';
import { AUTH_STORAGE_KEY } from '../auth/authStorage';

const baseURL = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return Promise.reject(error);

  let accessToken = session?.access_token;
  if (!accessToken) {
    try {
      accessToken = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || 'null')?.access_token;
    } catch {
      accessToken = null;
    }
  }
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {}).finally(() => {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        if (window.location.pathname !== '/login') window.location.replace('/login');
      });
      return Promise.reject(new Error('Сесія завершилася. Перенаправлення на сторінку входу.'));
    }
    if (status === 403) return Promise.reject(new Error('Недостатньо прав для цієї операції.'));
    if (error.response) return Promise.reject(new Error(error.response.data?.error || error.response.data?.detail || 'Сервер відхилив запит.'));
    return Promise.reject(new Error('Не вдалося підключитися до API.'));
  }
);
