import { useEffect, useMemo, useRef, useState } from 'react';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const formatDueDate = (value) => {
  if (!value) return 'No due date';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Due-date field with a calendar popover (Monday-first grid, month navigation).
 * The panel uses a very high z-index so it works inside dialogs and quick panels.
 */
export default function DateField({ value, onChange, placeholder = 'No due date' }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => (value ? new Date(`${value}T00:00:00`) : new Date()));
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) setCursor(value ? new Date(`${value}T00:00:00`) : new Date());
  }, [open, value]);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const result = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      result.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    }
    return result;
  }, [cursor]);

  const todayKey = toKey(new Date());

  function shiftMonth(delta) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <div className="dropdown date-field" ref={ref}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Due date"
      >
        <span className={`dropdown-value${value ? '' : ' is-placeholder'}`}>{formatDueDate(value || '') || placeholder}</span>
        <span className="dropdown-chevron" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="calendar-panel" role="dialog" aria-label="Choose due date">
          <header className="calendar-panel-head">
            <strong>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</strong>
            <div className="calendar-panel-nav">
              <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
            </div>
          </header>

          <div className="calendar-panel-weekdays">
            {WEEKDAYS.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
          </div>

          <div className="calendar-panel-grid">
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} className="calendar-day is-empty" />;
              const key = toKey(date);
              return (
                <button
                  type="button"
                  key={key}
                  className={`calendar-day${key === value ? ' is-selected' : ''}${key === todayKey ? ' is-today' : ''}`}
                  onClick={() => { onChange(key); setOpen(false); }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <button type="button" className="calendar-clear" onClick={() => { onChange(''); setOpen(false); }}>
            No due date
          </button>
        </div>
      )}
    </div>
  );
}
