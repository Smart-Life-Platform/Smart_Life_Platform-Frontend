import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import GoogleCalendarCallbackPage from '../pages/GoogleCalendarCallbackPage';
import { connectGoogleCalendar } from '../api/googleCalendarApi';

jest.mock('../api/googleCalendarApi', () => ({ connectGoogleCalendar: jest.fn() }));

beforeEach(() => jest.resetAllMocks());

function ProfileStub() {
  const location = useLocation();
  return <div>My profile page{location.search}</div>;
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/google-calendar/callback" element={<GoogleCalendarCallbackPage />} />
        <Route path="/profile" element={<ProfileStub />} />
        <Route path="/settings" element={<div>Settings page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

test('a successful connection lands on My profile with the connected flag', async () => {
  connectGoogleCalendar.mockResolvedValueOnce({ id: 1 });

  renderAt('/google-calendar/callback?code=abc&state=signed');

  expect(await screen.findByText('My profile page?calendar=connected')).toBeInTheDocument();
  expect(screen.queryByText(/Settings page/)).not.toBeInTheDocument();
});

test('a failed connection lands on My profile with the error flag', async () => {
  connectGoogleCalendar.mockRejectedValueOnce(new Error('nope'));

  renderAt('/google-calendar/callback?code=abc&state=signed');

  expect(await screen.findByText('My profile page?calendar=error')).toBeInTheDocument();
});

test('a missing code goes straight back to My profile', async () => {
  renderAt('/google-calendar/callback?state=signed');

  expect(await screen.findByText('My profile page?calendar=error')).toBeInTheDocument();
  expect(connectGoogleCalendar).not.toHaveBeenCalled();
});
