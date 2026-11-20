import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';
import Dropdown from '../common/Dropdown';
import DateField from '../common/DateField';

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

/** Compact "Add task" panel that floats above a column (calendar included). */
export default function QuickAddTask({ status, onCreate, onOpenFullDetails, onClose }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: new Date().toISOString().slice(0, 10),
    due_time: '09:00',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Enter a task title.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onCreate({
        ...form,
        title: form.title.trim(),
        status_id: status?.id,
      });
    } catch (createError) {
      setError(createError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="quick-add"
      onSubmit={submit}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <header>
        <span className="quick-add-status">
          <i className="status-dot" style={status?.color ? { background: status.color } : undefined} />
          {status?.name || 'Inbox'}
        </span>
        <button type="button" className="close-button" aria-label="Close" onClick={onClose}><UilTimes size="16" /></button>
      </header>

      <label className="field">
        Task title
        <input autoFocus value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Task title" />
      </label>

      <label className="field">
        Description <span className="field-hint">(optional)</span>
        <input value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Add a description" />
      </label>

      <div className="field-grid">
        <div className="field">
          <span className="field-label">Priority</span>
          <Dropdown value={form.priority} options={PRIORITIES} onChange={(value) => setField('priority', value)} ariaLabel="Priority" />
        </div>
        <div className="field">
          <span className="field-label">Due date</span>
          <DateField value={form.due_date} onChange={(value) => setField('due_date', value)} />
        </div>
      </div>

      <button type="button" className="ghost-link" onClick={onOpenFullDetails}>Open full task details</button>

      {error && <p className="form-error">{error}</p>}

      <footer>
        <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
        <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
      </footer>
    </form>
  );
}
