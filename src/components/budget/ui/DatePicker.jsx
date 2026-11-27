import { useEffect, useRef, useState } from 'react';
import { UilCalendarAlt, UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';

const pad = (n) => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const todayIso = () => {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
};

const display = (iso) => (iso ? iso.split('-').reverse().join('.') : '');

export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const [y, m] = (value || todayIso()).split('-').map(Number);
    return { y, m: m - 1 };
  });
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open && value) {
      const [y, m] = value.split('-').map(Number);
      setView({ y, m: m - 1 });
    }
    setOpen((o) => !o);
  };
  const shift = (delta) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const first = new Date(view.y, view.m, 1);
  const offset = (first.getDay() + 6) % 7; // тиждень починається з понеділка
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const title = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="b-dropdown b-dropdown--field b-datepicker" ref={rootRef}>
      <button type="button" className="b-dropdown__trigger" aria-haspopup="dialog" aria-expanded={open} aria-label="Date" onClick={toggle}>
        <span>{display(value)}</span>
        <UilCalendarAlt size="14" />
      </button>
      {open && (
        <div className="b-dropdown__panel b-datepicker__panel is-left" role="dialog" aria-label="Choose date">
          <div className="b-datepicker__head">
            <strong>{title}</strong>
            <span>
              <button type="button" className="b-icon-btn" onClick={() => shift(-1)} aria-label="Previous month"><UilAngleLeft size="14" /></button>
              <button type="button" className="b-icon-btn" onClick={() => shift(1)} aria-label="Next month"><UilAngleRight size="14" /></button>
            </span>
          </div>
          <div className="b-datepicker__grid">
            {WEEKDAYS.map((w, i) => <span key={i} className="b-datepicker__wd">{w}</span>)}
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} />;
              const iso = toIso(view.y, view.m, d);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`b-datepicker__day${iso === value ? ' is-selected' : ''}${iso === todayIso() ? ' is-today' : ''}`}
                  onClick={() => { onChange(iso); setOpen(false); }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
