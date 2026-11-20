import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';

export default function CreateBoardModal({ onClose, onSubmit }) {
  const [boardForm, setBoardForm] = useState({ name: '', description: '', icon: '', color: '#6d5ce7' });
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
          <h2>New board</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <UilTimes size="20" />
          </button>
        </div>
        <label>
          Name
          <input
            value={boardForm.name}
            onChange={(event) => setBoardForm({ ...boardForm, name: event.target.value })}
            placeholder="e.g. Development Project"
            required
            autoFocus
          />
        </label>
        <label>
          Description
          <textarea
            value={boardForm.description}
            onChange={(event) => setBoardForm({ ...boardForm, description: event.target.value })}
            placeholder="Describe the purpose of this board"
          />
        </label>
        <div className="form-grid">
          <label>
            Icon
            <input
              value={boardForm.icon}
              onChange={(event) => setBoardForm({ ...boardForm, icon: event.target.value })}
              placeholder="📋 or name"
            />
          </label>
          <label>
            Color
            <input
              type="color"
              value={boardForm.color}
              onChange={(event) => setBoardForm({ ...boardForm, color: event.target.value })}
            />
          </label>
        </div>
        {boardError && <p className="form-error">{boardError}</p>}
        <button className="primary-button full-width" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create board'}
        </button>
      </form>
    </div>
  );
}
