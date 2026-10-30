import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UilAngleDown,
  UilArrowLeft,
  UilBriefcaseAlt,
  UilEllipsisV,
  UilPlus,
} from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import Avatar, { getDisplayName } from '../components/common/Avatar';
import '../styles/settings.css';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`cal-toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="cal-toggle-knob" />
    </button>
  );
}

export default function CalendarsSettingsPage() {
  const { user } = useAuth();
  const [primaryOn, setPrimaryOn] = useState(true);
  const [holidaysOn, setHolidaysOn] = useState(false);

  const email = user?.email || '';
  const name = getDisplayName(user);
  const isGoogle = user?.app_metadata?.provider === 'google';

  return (
    <main className="cal-settings">
      <Link to="/settings" className="cal-back">
        <UilArrowLeft size="18" /> Back
      </Link>

      <div className="cal-settings-layout">
        <section className="cal-accounts">
          <h2 className="cal-heading">Accounts</h2>
          <p className="cal-subheading">Use any account to log in.</p>

          <div className="cal-account-card">
            <div className="cal-account-avatar">
              <Avatar user={user} size={56} />
              {isGoogle && <span className="cal-google-badge" aria-label="Google account">G</span>}
            </div>
            <div className="cal-account-info">
              <div className="cal-account-name">{name}</div>
              <div className="cal-account-email">{email}</div>
              <div className="cal-account-note">Main account</div>
            </div>
            <button type="button" className="cal-icon-button" aria-label="Account options">
              <UilEllipsisV size="18" />
            </button>
          </div>

          <button type="button" className="cal-link-button">
            <UilPlus size="18" /> Add account <UilAngleDown size="16" />
          </button>
        </section>

        <section className="cal-calendars">
          <h2 className="cal-heading">Connected calendars that affect your availability</h2>
          <p className="cal-subheading">These calendars affect scheduling, suggested times, &amp; Agent automations.</p>

          <div className="cal-calendar-card">
            <div className="cal-calendar-row">
              <Toggle checked={primaryOn} onChange={setPrimaryOn} label="Primary calendar" />
              <div className="cal-calendar-info">
                <div className="cal-calendar-name">{email}</div>
                <div className="cal-calendar-note">Primary calendar</div>
              </div>
              <button type="button" className="cal-type-button">
                <UilBriefcaseAlt size="16" /> Work <UilAngleDown size="16" />
              </button>
            </div>
          </div>

          <h2 className="cal-heading cal-heading-spaced">Calendars not connected</h2>
          <div className="cal-calendar-row cal-muted">
            <Toggle checked={holidaysOn} onChange={setHolidaysOn} label="Holidays in Ukraine" />
            <div className="cal-calendar-name">Holidays in Ukraine</div>
          </div>
        </section>
      </div>
    </main>
  );
}