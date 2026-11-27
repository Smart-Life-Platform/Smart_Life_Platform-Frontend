import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';
import ColorPalette, { PALETTE } from '../common/ColorPalette';

export default function MetadataModal({ type, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', color: PALETTE[0].value });
  const [submitting, setSubmitting] = useState(false);

  if (!type) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={() => onClose()}>
      <form
        className="task-modal"
        onSubmit={handleSubmit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <h2>New {type}</h2>
            <p className="modal-subtitle">
              {type === 'status' ? 'Columns are the stages tasks move through.' : 'Group tasks by area of work.'}
            </p>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <UilTimes size="20" />
          </button>
        </div>

        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder={`Enter ${type} name`}
            required
            autoFocus
          />
        </label>

        <ColorPalette label="Color" value={form.color} onChange={(color) => setForm({ ...form, color })} />

        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : `Create ${type}`}
          </button>
        </div>
      </form>
    </div>
  );
}
