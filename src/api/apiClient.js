import axios from 'axios';
import { supabase } from '../lib/supabase';
import { AUTH_STORAGE_KEY, readStoredAuth } from '../auth/authStorage';
import { messageFromPayload } from '../utils/errorMessage';
import { localeMessage } from '../utils/locale';

const baseURL = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  // The Django API authenticates with its own token (email + password login).
  // The Supabase token is used only for OAuth users, who have no Django token.
  // Preferring the Supabase session here would send a JWT the API cannot verify
  // and every request would come back as 401.
  let accessToken = readStoredAuth()?.access_token || null;

  if (!accessToken) {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return Promise.reject(error);
    accessToken = session?.access_token || null;
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
      return Promise.reject(new Error(localeMessage('sessionExpired')));
    }
    if (status === 403) return Promise.reject(new Error(localeMessage('insufficientRights')));
    if (error.response) return Promise.reject(new Error(messageFromPayload(error.response.data) || localeMessage('serverRejected')));
    return Promise.reject(new Error(localeMessage('apiUnavailable')));
  }
);
