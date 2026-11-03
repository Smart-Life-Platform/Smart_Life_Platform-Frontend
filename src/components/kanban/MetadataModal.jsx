import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';

export default function MetadataModal({
  type,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({ name: '', color: '#6d5ce7' });
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
          <h2>New {type}</h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
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

        <label>
          Color
          <input
            type="color"
            value={form.color}
            onChange={(event) => setForm({ ...form, color: event.target.value })}
          />
        </label>

        <button
          className="primary-button full-width"
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Creating…' : `Create ${type}`}
        </button>
      </form>
    </div>
  );
}
