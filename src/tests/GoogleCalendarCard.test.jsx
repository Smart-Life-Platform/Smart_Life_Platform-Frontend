import { render, screen } from '@testing-library/react';
import GoogleCalendarCard from '../components/integrations/GoogleCalendarCard';
import { getGoogleCalendarStatus } from '../api/googleCalendarApi';

jest.mock('../api/googleCalendarApi', () => ({
  getGoogleCalendarStatus: jest.fn(),
  getGoogleCalendarAuthUrl: jest.fn(),
  disconnectGoogleCalendar: jest.fn(),
  syncGoogleCalendar: jest.fn(),
}));

beforeEach(() => jest.resetAllMocks());

test('a failed status request shows a readable message, never "[object Object]"', async () => {
  getGoogleCalendarStatus.mockRejectedValueOnce(new Error('[object Object]'));

  render(<GoogleCalendarCard />);

  expect(await screen.findByText('Could not load the Google Calendar connection.')).toBeInTheDocument();
  expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Connect Google Calendar' })).toBeInTheDocument();
});

test('a connected account renders the Google address without stringifying objects', async () => {
  getGoogleCalendarStatus.mockResolvedValueOnce({
    connected: true,
    connection: { google_email: { address: 'someone@example.com' }, last_sync_at: { iso: '2026-11-24' } },
  });

  render(<GoogleCalendarCard />);

  expect(await screen.findByText(/Connected as your Google account/)).toBeInTheDocument();
  expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
});
