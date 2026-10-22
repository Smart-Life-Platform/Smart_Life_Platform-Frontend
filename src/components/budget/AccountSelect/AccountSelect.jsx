import { useState } from 'react';
import { UilAngleRight, UilTimes } from '@iconscout/react-unicons';

export default function AccountSelect({ accounts, value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = accounts.find((a) => a.id === value);

  return (
    <>
      <button type="button" className="account-select" onClick={() => setOpen(true)}>
        <span>{current?.name}</span>
        <UilAngleRight size="20" />
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>Рахунки</h3>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Закрити">
                <UilTimes size="22" />
              </button>
            </div>
            {accounts.map((a) => (
              <label key={a.id} className="modal__row">
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
