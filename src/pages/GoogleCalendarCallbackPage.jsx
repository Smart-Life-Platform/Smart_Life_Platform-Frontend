import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { connectGoogleCalendar } from '../api/googleCalendarApi';

/**
 * Google redirects here with ?code=… — the code is exchanged by the backend,
 * then the user lands back on Settings with a status message.
 */
export default function GoogleCalendarCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = params.get('code');
    if (!code) {
      navigate('/settings', { replace: true });
      return;
    }

    connectGoogleCalendar(code)
      .then(() => navigate('/settings?calendar=connected', { replace: true }))
      .catch(() => navigate('/settings?calendar=error', { replace: true }));
  }, [navigate, params]);

  return <p className="route-loading">Connecting your Google Calendar…</p>;
}
