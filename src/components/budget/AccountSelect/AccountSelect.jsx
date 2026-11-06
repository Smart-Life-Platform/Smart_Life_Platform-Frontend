import { useState } from 'react';
import { UilCalendarAlt, UilAngleDown, UilTimes } from '@iconscout/react-unicons';

export default function AccountSelect({ accounts, value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = accounts.find((a) => a.id === value);

  return (
    <>
      <button type="button" className="b-pill account-select" onClick={() => setOpen(true)}>
        <UilCalendarAlt size="14" />
        <span>{current?.name}</span>
        <UilAngleDown size="16" />
      </button>

      {open && (
        <div className="b-backdrop" onClick={() => setOpen(false)}>
          <div className="b-modal" onClick={(e) => e.stopPropagation()}>
            <div className="b-modal__header">
              <h3>Accounts</h3>
              <button type="button" className="b-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                <UilTimes size="18" />
              </button>
            </div>
            {accounts.map((a) => (
              <label key={a.id} className="b-modal__row">
                <span>{a.name}</span>
                <input
                  type="radio"
                  name="account"
                  checked={a.id === value}
                  onChange={() => {
                    onChange(a.id);
                    setOpen(false);
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
