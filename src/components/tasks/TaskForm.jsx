import { useState } from 'react';
import { UilEditAlt, UilTimes } from '@iconscout/react-unicons';

export default function TaskForm({ date, task, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    due_date: task?.due_date || date,
    priority: task?.priority || 'medium',
  });
  const [error, setError] = useState('');
  const isEditing = Boolean(task);

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await onSubmit(form);
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="task-modal" onSubmit={submit}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{isEditing ? 'EDIT TASK' : 'NEW TASK'}</p>
            <h2>{isEditing ? 'Edit task' : 'Create a task'}</h2>
            <p className="muted">{isEditing ? 'Update task details' : 'Add a new task to your planner'}</p>
          </div>
          <button type="button" className="close-button" aria-label="Close" onClick={onClose}><UilTimes size="20" /></button>
        </div>
        <label>Title<input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to be done?" /></label>
        <label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add details (optional)" /></label>
        <div className="form-grid">
          <label>Date<input type="date" required value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label>
          <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button full-width"><UilEditAlt size="17" /> {isEditing ? 'Save changes' : 'Create task'}</button>
      </form>
    </div>
  );
}
