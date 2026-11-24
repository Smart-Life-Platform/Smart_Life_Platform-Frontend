import { useEffect, useState } from 'react';
import { UilCalendarAlt } from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import { getGoogleCalendarAuthUrl, getGoogleCalendarStatus } from '../../api/googleCalendarApi';
import { errorText } from '../../utils/errorMessage';

const SKIP_KEY = 'avenor_calendar_prompt_skipped';

/**
 * Prompt shown once per session to Google-mail users who have not connected
 * their calendar yet (see Tasks_API_Front.md §7.1).
 */
export default function ConnectCalendarPrompt() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const email = (user?.email || '').toLowerCase();
    if (!isAuthenticated || !email.endsWith('@gmail.com')) return undefined;
    try {
      if (window.sessionStorage.getItem(SKIP_KEY) === '1') return undefined;
    } catch {
      return undefined;
    }

    let cancelled = false;
    getGoogleCalendarStatus()
      .then((data) => { if (!cancelled && !data?.connected) setOpen(true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.email]);

  function skip() {
    try { window.sessionStorage.setItem(SKIP_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  }

  async function connect() {
    setBusy(true);
    setError('');
    try {
      const { auth_url: authUrl } = await getGoogleCalendarAuthUrl();
      if (!authUrl) throw new Error('Google Calendar is not configured on the server.');
      window.location.href = authUrl;
    } catch (connectError) {
      setError(errorText(connectError, 'Could not connect Google Calendar.'));
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={skip}>
      <section className="task-modal connect-calendar-modal" onMouseDown={(event) => event.stopPropagation()}>
        <span className="connect-calendar-icon"><UilCalendarAlt size="22" /></span>
        <h2>Connect your Google Calendar?</h2>
        <p>Sync events, deadlines and reminders with your workspace. Your event board stays private to you.</p>
        {error && <p className="form-error">{error}</p>}
        <div className="connect-calendar-actions">
          <button type="button" className="primary-button" onClick={connect} disabled={busy}>
            {busy ? 'Opening…' : 'Connect Google Calendar'}
          </button>
          <button type="button" className="ghost-button" onClick={skip} disabled={busy}>Skip for now</button>
        </div>
      </section>
    </div>
  );
}
