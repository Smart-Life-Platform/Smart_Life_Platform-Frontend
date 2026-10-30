import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UilAngleDown, UilAngleRight, UilArrowLeft } from '@iconscout/react-unicons';
import '../styles/settings.css';

const TIMEZONES = [
  { value: 'Europe/Kyiv', label: 'Eastern European Time (Kyiv)' },
  { value: 'Europe/Warsaw', label: 'Central European Time (Warsaw)' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (London)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
];

const HOURS_ROWS = [
  { key: 'working', title: 'Working Hours', text: 'Default for work events' },
  { key: 'personal', title: 'Personal Hours', text: 'Default for personal events' },
];

export default function HoursSettingsPage() {
  const [timezone, setTimezone] = useState('Europe/Kyiv');
  const timezoneLabel = TIMEZONES.find((tz) => tz.value === timezone)?.label || timezone;

  return (
    <main className="hours-settings">
      <Link to="/settings" className="cal-back">
        <UilArrowLeft size="18" /> Back
      </Link>

      <div className="hours-content">
        <section className="hours-section">
          <h2 className="cal-heading">Home timezone</h2>
          <p className="hours-text">Set the timezone you&apos;d like to use for the location where you are normally.</p>

          <label className="hours-select-wrap">
            <select
              className="hours-select"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              aria-label="Home timezone"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <UilAngleDown size="16" className="hours-select-icon" />
          </label>
        </section>

        <section className="hours-section">
          <h2 className="cal-heading">Hours</h2>
          <p className="hours-text">
            Set your default hours for scheduling tasks and events.{' '}
            <strong>Your hours are in {timezoneLabel}.</strong>
          </p>

          <div className="hours-list">
            {HOURS_ROWS.map(({ key, title, text }) => (
              <button type="button" className="hours-row" key={key}>
                <span>
                  <span className="hours-row-title">{title}</span>
                  <span className="hours-row-text">{text}</span>
                </span>
                <UilAngleRight size="22" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}