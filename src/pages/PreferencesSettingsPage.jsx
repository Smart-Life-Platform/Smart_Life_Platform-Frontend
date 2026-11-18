import { Link } from 'react-router-dom';
import { UilArrowLeft, UilCheck } from '@iconscout/react-unicons';
import Toggle from '../components/settings/Toggle';
import SaveStatus from '../components/settings/SaveStatus';
import useProfileSettings from '../hooks/useProfileSettings';
import { windowLabel } from '../utils/schedulingRules';
import '../styles/settings.css';

const MINUTES = [0, 15, 30, 45];

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
  const { loading, settings, status, error, updateSettings } = useProfileSettings();
  const prefs = settings.preferences;

  function setPreference(patch) {
    updateSettings({ preferences: patch });
  }

  function toggleInterval(minutes) {
    const current = prefs.intervals;
    if (current.includes(minutes)) {
      // at least one interval must stay selected
      if (current.length === 1) return;
      setPreference({ intervals: current.filter((item) => item !== minutes) });
    } else {
      setPreference({ intervals: [...current, minutes].sort((a, b) => a - b) });
    }
  }

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
            <p className="pref-hint">When turned off, the AI assistant page is unavailable.</p>
          </div>
          <Toggle
            checked={prefs.aiEnabled}
            disabled={loading}
            onChange={(value) => setPreference({ aiEnabled: value })}
            label="Enable AI assistant"
          />
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
            value={prefs.schedulingWeeks}
            disabled={loading}
            onChange={(event) => setPreference({ schedulingWeeks: Number(event.target.value) })}
            aria-label="Scheduling window in weeks"
          />
          <div className="pref-slider-label">{windowLabel(prefs.schedulingWeeks)}</div>
          <p className="pref-hint">Tasks can&apos;t be scheduled further ahead than this in the calendar.</p>
        </section>

        <section className="pref-section">
          <h2 className="cal-heading">Start time intervals</h2>
          <p className="hours-text">
            Select the intervals available when scheduling tasks and events.
          </p>

          <div className="pref-pills">
            {MINUTES.map((minutes) => {
              const active = prefs.intervals.includes(minutes);
              return (
                <button
                  type="button"
                  key={minutes}
                  className={`pref-pill${active ? ' active' : ''}`}
                  aria-pressed={active}
                  disabled={loading}
                  onClick={() => toggleInterval(minutes)}
                >
                  {active && <UilCheck size="16" />} {formatMinutes(minutes)}
                </button>
              );
            })}
          </div>

          <div className="pref-example-title">Example times with selection</div>
          <div className="pref-example">{buildExampleTimes(prefs.intervals).join(',  ')}</div>
          <p className="pref-hint">Task times set in the calendar are rounded to the nearest selected interval.</p>
        </section>

        <SaveStatus status={status} error={error} />
      </div>
    </main>
  );
}