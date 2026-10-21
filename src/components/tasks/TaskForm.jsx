import { useState } from 'react';

export default function TaskForm({ date, onClose, onSubmit }) {
  const [form, setForm] = useState({ title: '', description: '', due_date: date, priority: 'medium' });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    try { await onSubmit(form); } catch (submitError) { setError(submitError.message); }
  }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="task-modal" onSubmit={submit}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">NEW TASK</p>
          <h2>Create a task</h2>
          <p className="muted">Add a new task to your planner</p>
        </div><button type="button" className="close-button" onClick={onClose}>×</button></div><label>Title<input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to be done?" /></label><label>Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add details (optional)" /></label><div className="form-grid"><label>Date<input type="date" required value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></div>{error && <p className="form-error">{error}</p>}<button className="primary-button full-width">Create task</button></form></div>;
}
