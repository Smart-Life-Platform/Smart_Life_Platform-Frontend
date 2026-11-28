import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';
import ColorPalette, { PALETTE, isPaletteColor } from '../common/ColorPalette';

export default function EditBoardModal({ board, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: board?.name || '',
    description: board?.description || '',
    color: isPaletteColor(board?.color) ? board.color : PALETTE[0].value,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      setError('Enter a board name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({ ...form, name: form.name.trim() });
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="task-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>Edit board</h2>
            <p className="modal-subtitle">Change the name, description and colour.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <UilTimes size="20" />
          </button>
        </div>

        <label>
          Board name
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Board name"
            autoFocus
          />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="What is this board for?"
          />
        </label>

        <ColorPalette
          label="Board color"
          value={form.color}
          onChange={(color) => setForm({ ...form, color })}
        />

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
