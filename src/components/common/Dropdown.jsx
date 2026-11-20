import { useEffect, useRef, useState } from 'react';

/**
 * Popover select used across the task dialogs. The panel is absolutely positioned
 * with a high z-index so it always renders above the dialog content.
 */
export default function Dropdown({
  value,
  options = [],
  onChange,
  placeholder = 'Select',
  ariaLabel,
  className = '',
  panelClassName = '',
}) {
  const [open, setOpen] = useState(false);
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

  const selected = options.find((option) => String(option.value) === String(value));

  return (
    <div className={`dropdown ${className}`.trim()} ref={ref}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={selected ? 'dropdown-value' : 'dropdown-value is-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="dropdown-chevron" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className={`dropdown-panel ${panelClassName}`.trim()} role="listbox">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={String(option.value) === String(value)}
              className={`dropdown-option${String(option.value) === String(value) ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
