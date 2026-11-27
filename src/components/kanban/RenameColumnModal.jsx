import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';

export default function RenameColumnModal({ column, onClose, onSubmit }) {
  const [name, setName] = useState(column?.name || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError('Enter a column name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="task-modal column-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <h2>Rename column</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <UilTimes size="20" />
          </button>
        </div>

        <label>
          Column name
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            placeholder="Column name"
            autoFocus
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
