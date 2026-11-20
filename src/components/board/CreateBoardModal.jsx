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
      setBoardError(err.message || 'Помилка при створенні дошки');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="task-modal board-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <h2>Нова дошка</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Закрити">
            <UilTimes size="20" />
          </button>
        </div>
        <label>
          Назва
          <input
            value={boardForm.name}
            onChange={(event) => setBoardForm({ ...boardForm, name: event.target.value })}
            placeholder="Наприклад: Проєкт розробки"
            required
            autoFocus
          />
        </label>
        <label>
          Опис
          <textarea
            value={boardForm.description}
            onChange={(event) => setBoardForm({ ...boardForm, description: event.target.value })}
            placeholder="Опис мети цієї дошки"
          />
        </label>
        <div className="form-grid">
          <label>
            Іконка
            <input
              value={boardForm.icon}
              onChange={(event) => setBoardForm({ ...boardForm, icon: event.target.value })}
              placeholder="📋 або назва"
            />
          </label>
          <label>
            Колір
            <input
              type="color"
              value={boardForm.color}
              onChange={(event) => setBoardForm({ ...boardForm, color: event.target.value })}
            />
          </label>
        </div>
        {boardError && <p className="form-error">{boardError}</p>}
        <button className="primary-button full-width" type="submit" disabled={loading}>
          {loading ? 'Створення…' : 'Створити дошку'}
        </button>
      </form>
    </div>
  );
}

