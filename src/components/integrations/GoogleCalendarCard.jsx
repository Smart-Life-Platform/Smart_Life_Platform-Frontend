import { useEffect, useState } from 'react';
import { UilCalendarAlt } from '@iconscout/react-unicons';
import {
  disconnectGoogleCalendar,
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  syncGoogleCalendar,
} from '../../api/googleCalendarApi';
import { errorText } from '../../utils/errorMessage';

const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function GoogleCalendarCard() {
  const [status, setStatus] = useState({ connected: false, connection: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    getGoogleCalendarStatus()
      .then((data) => { if (!cancelled) setStatus(data || { connected: false }); })
      .catch((loadError) => { if (!cancelled) setError(errorText(loadError, 'Could not load the Google Calendar connection.')); });
    return () => { cancelled = true; };
  }, []);

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

  async function disconnect() {
    setBusy(true);
    setError('');
    try {
      await disconnectGoogleCalendar();
      setStatus({ connected: false, connection: null });
      setMessage('Google Calendar disconnected.');
    } catch (disconnectError) {
      setError(errorText(disconnectError, 'Could not disconnect Google Calendar.'));
    } finally {
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await syncGoogleCalendar();
      const data = await getGoogleCalendarStatus();
      setStatus(data || { connected: false });
      setMessage(`Synced ${today()}.`);
    } catch (syncError) {
      setError(errorText(syncError, 'Could not sync Google Calendar.'));
    } finally {
      setBusy(false);
    }
  }

  const connection = status?.connection;
  // Guard against non-string fields: React renders an object as "[object Object]".
  const googleEmail = typeof connection?.google_email === 'string' ? connection.google_email : '';
  const lastSync = typeof connection?.last_sync_at === 'string' ? new Date(connection.last_sync_at) : null;
  const lastSyncText = lastSync && !Number.isNaN(lastSync.getTime()) ? lastSync.toLocaleString() : '';

  return (
    <section className="integration-card">
      <span className="integration-icon"><UilCalendarAlt size="18" /></span>
      <div className="integration-copy">
        <h2>Google Calendar</h2>
        {status?.connected ? (
          <p>
            Connected as {googleEmail || 'your Google account'}
            {lastSyncText ? ` · last sync ${lastSyncText}` : ''}
          </p>
        ) : (
          <p>Sync events, deadlines and reminders with your calendar.</p>
        )}
        {message && <p role="status">{message}</p>}
        {error && <p className="form-error">{error}</p>}
      </div>
      <div className="integration-actions">
        {status?.connected ? (
          <>
            <span className="integration-badge">Connected</span>
            <button type="button" className="ghost-button" onClick={sync} disabled={busy}>Sync now</button>
            <button type="button" className="ghost-button" onClick={disconnect} disabled={busy}>Disconnect</button>
          </>
        ) : (
          <button type="button" className="primary-button" onClick={connect} disabled={busy}>
            {busy ? 'Opening…' : 'Connect Google Calendar'}
          </button>
        )}
      </div>
    </section>
  );
}
