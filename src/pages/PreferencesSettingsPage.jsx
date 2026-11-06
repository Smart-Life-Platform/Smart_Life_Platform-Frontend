import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UilArrowLeft, UilCheck } from '@iconscout/react-unicons';
import '../styles/settings.css';

const MINUTES = [0, 15, 30, 45];

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

function formatMinutes(minutes) {
  return `:${String(minutes).padStart(2, '0')}`;
}

function buildExampleTimes(selected) {
  const times = [];
  for (let hour = 8; hour <= 9; hour += 1) {
    for (const minutes of MINUTES) {
      if (hour === 9 && minutes > 0) continue;
      if (selected.includes(minutes)) times.push(`${hour}:${String(minutes).padStart(2, '0')}`);
    }
  }
  return times;
}

export default function PreferencesSettingsPage() {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [weeks, setWeeks] = useState(1);
  const [intervals, setIntervals] = useState([0, 15, 30, 45]);

  function toggleInterval(minutes) {
    setIntervals((current) => {
      if (current.includes(minutes)) {
        // at least one interval must stay selected
        return current.length === 1 ? current : current.filter((item) => item !== minutes);
      }
      return [...current, minutes].sort((a, b) => a - b);
    });
  }

  const weeksLabel = `${weeks} week${weeks > 1 ? 's' : ''}`;

  return (
    <main className="hours-settings">
      <Link to="/settings" className="cal-back">
        <UilArrowLeft size="18" /> Back
      </Link>

      <div className="pref-content">
        <section className="pref-section pref-row">
          <div>
            <h2 className="cal-heading">Enable AI assistant</h2>
            <p className="hours-text">
              Enable AI-powered chat assistance to manage your schedule, tasks, and budget.
            </p>
          </div>
          <Toggle checked={aiEnabled} onChange={setAiEnabled} label="Enable AI assistant" />
        </section>

        <section className="pref-section">
          <h2 className="cal-heading">Scheduling window</h2>
          <p className="hours-text">
            Set how far in advance you&apos;d like to schedule your tasks and events.
          </p>
          <input
            className="pref-slider"
            type="range"
            min="1"
            max="8"
            step="1"
            value={weeks}
            onChange={(event) => setWeeks(Number(event.target.value))}
            aria-label="Scheduling window in weeks"
          />
          <div className="pref-slider-label">{weeksLabel}</div>
        </section>

        <section className="pref-section">
          <h2 className="cal-heading">Start time intervals</h2>
          <p className="hours-text">
            Select the intervals available when scheduling tasks and events.
          </p>

          <div className="pref-pills">
            {MINUTES.map((minutes) => {
              const active = intervals.includes(minutes);
              return (
                <button
                  type="button"
                  key={minutes}
                  className={`pref-pill${active ? ' active' : ''}`}
                  aria-pressed={active}
                  onClick={() => toggleInterval(minutes)}
                >
                  {active && <UilCheck size="16" />} {formatMinutes(minutes)}
                </button>
              );
            })}
          </div>

          <div className="pref-example-title">Example times with selection</div>
          <div className="pref-example">{buildExampleTimes(intervals).join(',  ')}</div>
        </section>
      </div>
    </main>
  );
}