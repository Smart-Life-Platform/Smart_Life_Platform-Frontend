import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';
import ColorPalette, { PALETTE } from '../common/ColorPalette';

export default function CreateBoardModal({ onClose, onSubmit }) {
  const [boardForm, setBoardForm] = useState({ name: '', description: '', icon: '', color: PALETTE[0].value });
  const [boardError, setBoardError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBoardError('');
    setLoading(true);
    try {
      await onSubmit(boardForm);
      onClose();
    } catch (err) {
      setBoardError(err.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="task-modal board-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2>Create new board</h2>
            <p className="modal-subtitle">Give your next project a place to grow.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <UilTimes size="20" />
          </button>
        </div>

        <label>
          Board name
          <input
            value={boardForm.name}
            onChange={(event) => setBoardForm({ ...boardForm, name: event.target.value })}
            placeholder="Board name"
            required
            autoFocus
          />
        </label>
        <label>
          Description (optional)
          <textarea
            value={boardForm.description}
            onChange={(event) => setBoardForm({ ...boardForm, description: event.target.value })}
            placeholder="What is this board for?"
          />
        </label>

        <ColorPalette
          label="Board color"
          value={boardForm.color}
          onChange={(color) => setBoardForm({ ...boardForm, color })}
        />

        {boardError && <p className="form-error">{boardError}</p>}

        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create board'}
          </button>
        </div>
      </form>
    </div>
  );
}
