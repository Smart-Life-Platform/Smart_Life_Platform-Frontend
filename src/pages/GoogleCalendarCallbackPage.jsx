import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { connectGoogleCalendar } from '../api/googleCalendarApi';

/**
 * Google redirects here with ?code=… — the code is exchanged by the backend,
 * then the user lands back on My profile with a status message.
 */
export default function GoogleCalendarCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state || params.has('error')) {
      navigate('/profile?calendar=error', { replace: true });
      return;
    }

    connectGoogleCalendar(code, state)
      .then(() => navigate('/profile?calendar=connected', { replace: true }))
      .catch(() => navigate('/profile?calendar=error', { replace: true }));
  }, [navigate, params]);

  return <p className="route-loading">Connecting your Google Calendar…</p>;
}
