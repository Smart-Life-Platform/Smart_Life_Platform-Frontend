import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UilAngleDown, UilAngleRight, UilArrowLeft } from '@iconscout/react-unicons';
import Toggle from '../components/settings/Toggle';
import SaveStatus from '../components/settings/SaveStatus';
import useProfileSettings from '../hooks/useProfileSettings';
import { DAYS, timezoneOptions, validateWeek } from '../utils/settingsDefaults';
import '../styles/settings.css';

const HOURS_ROWS = [
  { key: 'working', title: 'Working Hours', text: 'Default for work events' },
  { key: 'personal', title: 'Personal Hours', text: 'Default for personal events' },
];

function HoursEditor({ value, onSave }) {
  const [draft, setDraft] = useState(value);
  const validationError = validateWeek(draft);
  const changed = JSON.stringify(draft) !== JSON.stringify(value);

  function change(day, patch) {
    setDraft((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  }

  return (
    <div className="hours-editor">
      {DAYS.map(([day, label]) => {
        const slot = draft[day];
        return (
          <div className="hours-day" key={day}>
            <Toggle checked={slot.on} onChange={(on) => change(day, { on })} label={`${label} enabled`} />
            <span className="hours-day-name">{label}</span>
            <span className="hours-day-times">
              <input
                type="time"
                value={slot.start}
                disabled={!slot.on}
                onChange={(event) => change(day, { start: event.target.value })}
                aria-label={`${label} start`}
              />
              <span>–</span>
              <input
                type="time"
                value={slot.end}
                disabled={!slot.on}
                onChange={(event) => change(day, { end: event.target.value })}
                aria-label={`${label} end`}
              />
            </span>
          </div>
        );
      })}
      {validationError && <p className="hours-error" role="alert">{validationError}</p>}
      <div className="hours-editor-actions">
        <button
          type="button"
          className="hours-save"
          disabled={!changed || Boolean(validationError)}
          onClick={() => onSave(draft)}
        >
          Save hours
        </button>
      </div>
    </div>
  );
}

export default function HoursSettingsPage() {
  const { loading, timezone, settings, status, error, updateSettings, updateTimezone } = useProfileSettings();
  const [openKey, setOpenKey] = useState(null);
  const options = timezoneOptions(timezone);
  const timezoneLabel = options.find((tz) => tz.value === timezone)?.label || timezone;

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
              disabled={loading}
              onChange={(event) => updateTimezone(event.target.value)}
              aria-label="Home timezone"
            >
              {options.map((tz) => (
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
            {HOURS_ROWS.map(({ key, title, text }) => {
              const open = openKey === key;
              return (
                <div className="hours-item" key={key}>
                  <button
                    type="button"
                    className="hours-row"
                    aria-expanded={open}
                    disabled={loading}
                    onClick={() => setOpenKey(open ? null : key)}
                  >
                    <span>
                      <span className="hours-row-title">{title}</span>
                      <span className="hours-row-text">{text}</span>
                    </span>
                    {open ? <UilAngleDown size="22" /> : <UilAngleRight size="22" />}
                  </button>
                  {open && (
                    <HoursEditor
                      value={settings.hours[key]}
                      onSave={(week) => updateSettings({ hours: { [key]: week } })}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <SaveStatus status={status} error={error} />
        </section>
      </div>
    </main>
  );
}