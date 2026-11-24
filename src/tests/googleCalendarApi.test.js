import { apiClient } from '../api/apiClient';
import { connectGoogleCalendar, getGoogleCalendarAuthUrl, getGoogleCalendarStatus } from '../api/googleCalendarApi';
import { getSiteOrigin } from '../auth/oauthRedirect';

jest.mock('../api/apiClient', () => ({ apiClient: { get: jest.fn(), post: jest.fn() } }));

beforeEach(() => jest.resetAllMocks());

test('calendar auth and code exchange use the same callback on the current origin', async () => {
  apiClient.get.mockResolvedValue({ data: { auth_url: 'https://accounts.google.com/' } });
  apiClient.post.mockResolvedValue({ data: { id: 1 } });
  const redirect_uri = `${window.location.origin}/google-calendar/callback`;
  await getGoogleCalendarAuthUrl();
  expect(apiClient.get).toHaveBeenCalledWith('/events/google-calendar/auth-url/', { params: { redirect_uri } });
  await connectGoogleCalendar('authorization-code', 'signed-state');
  expect(apiClient.post).toHaveBeenCalledWith('/events/google-calendar/callback/', {
    code: 'authorization-code', state: 'signed-state', redirect_uri,
  });
});

test('normalizes the backend is_connected flag for both integration widgets', async () => {
  apiClient.get.mockResolvedValueOnce({ data: { is_connected: true, connection: { id: 1 } } });
  expect(await getGoogleCalendarStatus()).toMatchObject({ connected: true, connection: { id: 1 } });
  apiClient.get.mockResolvedValueOnce({ data: { is_connected: false, connected: true } });
  expect(await getGoogleCalendarStatus()).toMatchObject({ connected: false });
});

test.each(['localhost', '127.0.0.1', '[::1]'])('a production site env cannot override local sign-in on %s', hostname => {
  const previous = process.env.REACT_APP_SITE_URL;
  process.env.REACT_APP_SITE_URL = 'https://deployed.example';
  try {
    const origin = `http://${hostname}:3000`;
    expect(getSiteOrigin({ hostname, origin })).toBe(origin);
    expect(getSiteOrigin({ hostname: 'preview.example', origin: 'https://preview.example' })).toBe('https://deployed.example');
  } finally {
    if (previous === undefined) delete process.env.REACT_APP_SITE_URL;
    else process.env.REACT_APP_SITE_URL = previous;
  }
});
