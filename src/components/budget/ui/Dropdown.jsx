import { useEffect, useRef, useState } from 'react';
import { UilAngleDown, UilCheck } from '@iconscout/react-unicons';

export default function Dropdown({
  value, options, onChange, variant = 'pill', align = 'left', icon, placeholder = 'Select…', ariaLabel, className = '',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedRef = useRef(null);
  const current = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    selectedRef.current?.scrollIntoView?.({ block: 'nearest' });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (option) => {
    setOpen(false);
    if (String(option.value) !== String(value)) onChange(option.value);
  };

  return (
    <div className={`b-dropdown b-dropdown--${variant} ${className}`} ref={rootRef}>
      <button
        type="button"
        className="b-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        <span className={current ? '' : 'is-placeholder'}>{current ? current.label : placeholder}</span>
        <UilAngleDown size="14" />
      </button>
      {open && (
        <ul className={`b-dropdown__panel is-${align}`} role="listbox">
          {options.map((o) => {
            const selected = String(o.value) === String(value);
            return (
              <li key={o.value} role="presentation">
                <button type="button" role="option" aria-selected={selected} ref={selected ? selectedRef : null} onClick={() => pick(o)}>
                  <span>{o.label}</span>
                  {selected && <UilCheck size="14" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
