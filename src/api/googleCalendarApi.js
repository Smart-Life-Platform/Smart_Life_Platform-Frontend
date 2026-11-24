import { apiClient } from './apiClient';

const BASE = '/events/google-calendar';

/**
 * Google Calendar integration.
 *
 * The backend owns the OAuth exchange:
 *  1. GET  /auth-url/   → { auth_url } to open in a popup/window
 *  2. Google redirects back with ?code=... → POST /callback/ { code }
 *  3. GET  /status/     → { connected, connection }
 *  4. POST /sync/       → push/pull changes
 *  5. POST /disconnect/ → stop syncing
 */

export const getGoogleCalendarStatus = async () => {
  const { data } = await apiClient.get(`${BASE}/status/`);
  return { ...data, connected: Boolean(data?.is_connected ?? data?.connected) };
};

export const GOOGLE_CALENDAR_CALLBACK_PATH = '/google-calendar/callback';
export const getGoogleCalendarRedirectUri = () => `${window.location.origin}${GOOGLE_CALENDAR_CALLBACK_PATH}`;

export const getGoogleCalendarAuthUrl = async () =>
  (await apiClient.get(`${BASE}/auth-url/`, { params: { redirect_uri: getGoogleCalendarRedirectUri() } })).data;

export const connectGoogleCalendar = async (code, state) =>
  (await apiClient.post(`${BASE}/callback/`, { code, state, redirect_uri: getGoogleCalendarRedirectUri() })).data;

export const syncGoogleCalendar = async () => (await apiClient.post(`${BASE}/sync/`)).data;

export const disconnectGoogleCalendar = async () => (await apiClient.post(`${BASE}/disconnect/`)).data;

/** True when the backend provisioned the protected «Google Calendar» system board. */
export const isSystemBoard = (board) => Boolean(board?.system_board || board?.integration_type === 'google_calendar');
