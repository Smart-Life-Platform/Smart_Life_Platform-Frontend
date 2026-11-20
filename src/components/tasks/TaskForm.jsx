import { useCallback, useEffect, useRef, useState } from 'react';
import { UilPlus, UilTimes, UilCheckSquare, UilSquareFull } from '@iconscout/react-unicons';
import Dropdown from '../common/Dropdown';
import DateField from '../common/DateField';
import { priorityName } from '../../utils/priority';
import { getSubtasks, updateSubtask, deleteSubtask } from '../../api/subtasksApi';

const relationId = (value) => {
  if (Array.isArray(value)) return relationId(value[0]);
  if (value && typeof value === 'object') return relationId(value.id);
  if (value === '' || value === null || value === undefined) return '';
  const id = Number(value);
  return Number.isInteger(id) ? id : '';
};

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const REMINDERS = [
  { value: 'none', label: 'None' },
  { value: 'at_time', label: 'At time of due date' },
  { value: '10m', label: '10 minutes before' },
  { value: '1h', label: '1 hour before' },
  { value: '1d', label: '1 day before' },
];

export default function TaskForm({ date, task, statuses = [], categories = [], assignees = [], onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    due_date: task?.due_date || date || '',
    due_time: task?.due_time?.slice(0, 5) || '09:00',
    priority: priorityName(task?.priority) || 'medium',
    status_id: relationId(task?.status_id ?? task?.status?.id ?? task?.status ?? statuses[0]?.id),
    category_id: relationId(task?.category_id ?? task?.category?.id ?? task?.category),
    assignee_id: relationId(task?.assignee_id ?? task?.assignee?.id ?? task?.assignee),
    reminder: task?.reminder || 'none',
  });

  // Existing saved subtasks (edit mode) — stored with {id, title, is_done}
  const [existingSubtasks, setExistingSubtasks] = useState([]);
  // New subtasks to be created on save — plain strings
  const [newSubtasks, setNewSubtasks] = useState([]);
  const [checklistDraft, setChecklistDraft] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(new Set());
  const submissionPending = useRef(false);
  // A placeholder { status_id } (column pre-select) is not an existing task.
  const isEditing = Boolean(task?.id);

  // Load existing subtasks when editing
  const loadExisting = useCallback(async () => {
    if (!task?.id) return;
    try {
      const data = await getSubtasks(task.id);
      setExistingSubtasks(data);
    } catch {
      // Fall back to embedded subtasks if API fails
      if (Array.isArray(task?.subtasks)) {
        setExistingSubtasks(task.subtasks.map((s) =>
          typeof s === 'string' ? { title: s, is_done: false } : s
        ));
      }
    }
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isEditing) {
      // Show embedded data immediately while API loads
      if (Array.isArray(task?.subtasks) && task.subtasks.length > 0) {
        setExistingSubtasks(task.subtasks.map((s) =>
          typeof s === 'string' ? { title: s, is_done: false } : s
        ));
      }
      loadExisting();
    }
  }, [isEditing, loadExisting]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function addChecklistItem() {
    const title = checklistDraft.trim();
    if (!title) return;
    setNewSubtasks((current) => [...current, title]);
    setChecklistDraft('');
  }

  /** Toggle an already-saved subtask's is_done state directly via API. */
  async function toggleExisting(subtask) {
    if (!subtask.id || toggling.has(subtask.id)) return;
    const next = !subtask.is_done;
    setExistingSubtasks((current) =>
      current.map((s) => (s.id === subtask.id ? { ...s, is_done: next } : s))
    );
    setToggling((current) => new Set([...current, subtask.id]));
    try {
      await updateSubtask(subtask.id, { is_done: next });
    } catch {
      // Revert
      setExistingSubtasks((current) =>
        current.map((s) => (s.id === subtask.id ? { ...s, is_done: !next } : s))
      );
    } finally {
      setToggling((current) => {
        const updated = new Set(current);
        updated.delete(subtask.id);
        return updated;
      });
    }
  }

  /** Delete an already-saved subtask. */
  async function removeExisting(subtask) {
    setExistingSubtasks((current) => current.filter((s) => s.id !== subtask.id));
    try {
      if (subtask.id) await deleteSubtask(subtask.id);
    } catch {
      setExistingSubtasks((current) => [...current, subtask]);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (submissionPending.current) return;
    setError('');
    if (!form.title.trim()) {
      setError('Enter a task title.');
      return;
    }

    submissionPending.current = true;
    setSubmitting(true);
    try {
      // Only pass NEW (unsaved) subtask titles — existing ones are already saved/updated
      await onSubmit({
        ...form,
        title: form.title.trim(),
        assignee_id: form.assignee_id === '' ? null : form.assignee_id,
        category_id: form.category_id === '' ? null : form.category_id,
        due_date: form.due_date || null,
        subtasks: newSubtasks,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      submissionPending.current = false;
      setSubmitting(false);
    }
  }

  const statusOptions = statuses.map((status) => ({ value: status.id, label: status.name }));
  const categoryOptions = [
    { value: '', label: 'No category' },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];
  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...assignees.map((member) => ({ value: member.id, label: member.name })),
  ];

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="task-modal task-dialog" onSubmit={submit}>
        <header className="task-dialog-head">
          <div>
            <h2>{isEditing ? 'Edit task' : 'Create new task'}</h2>
            <p>Add the details. Keep your next step clear.</p>
          </div>
          <button type="button" className="close-button" aria-label="Close" onClick={onClose}><UilTimes size="18" /></button>
        </header>

        <label className="field">
          Task title
          <input autoFocus value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Task title" />
        </label>

        <label className="field">
          Description
          <textarea rows="3" value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Add a description" />
        </label>

        <div className="field-grid">
          <div className="field">
            <span className="field-label">Category</span>
            <Dropdown value={form.category_id} options={categoryOptions} onChange={(value) => setField('category_id', value)} ariaLabel="Category" />
          </div>
          <div className="field">
            <span className="field-label">Status</span>
            <Dropdown value={form.status_id} options={statusOptions} onChange={(value) => setField('status_id', value)} ariaLabel="Status" placeholder="Select status" />
          </div>

          <div className="field">
            <span className="field-label">Priority</span>
            <Dropdown value={form.priority} options={PRIORITIES} onChange={(value) => setField('priority', value)} ariaLabel="Priority" />
          </div>
          <div className="field">
            <span className="field-label">Due date</span>
            <div className="field-inline">
              <DateField value={form.due_date} onChange={(value) => setField('due_date', value)} />
              <input
                className="time-input"
                type="time"
                value={form.due_time}
                onChange={(event) => setField('due_time', event.target.value)}
                aria-label="Due time"
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Assignee</span>
            <Dropdown
              value={form.assignee_id}
              options={assigneeOptions}
              onChange={(value) => setField('assignee_id', value)}
              ariaLabel="Assignee"
            />
          </div>
          <div className="field">
            <span className="field-label">Reminder <span className="field-hint">(optional)</span></span>
            <Dropdown value={form.reminder} options={REMINDERS} onChange={(value) => setField('reminder', value)} ariaLabel="Reminder" />
          </div>

          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <span className="field-label">Subtasks<span className="field-hint">Checklist</span></span>

            {/* Existing subtasks (edit mode) — toggle done inline */}
            {isEditing && existingSubtasks.length > 0 && (
              <ul className="checklist checklist-existing">
                {existingSubtasks.map((subtask, index) => (
                  <li key={subtask.id ?? index} className={subtask.is_done ? 'checklist-done' : ''}>
                    <button
                      type="button"
                      className="checklist-toggle"
                      onClick={() => toggleExisting(subtask)}
                      disabled={toggling.has(subtask.id)}
                      aria-label={subtask.is_done ? 'Mark as not done' : 'Mark as done'}
                    >
                      {subtask.is_done
                        ? <UilCheckSquare size="15" />
                        : <UilSquareFull size="15" />}
                    </button>
                    <span className="checklist-title">{subtask.title}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${subtask.title}`}
                      onClick={() => removeExisting(subtask)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* New unsaved subtasks */}
            {newSubtasks.length > 0 && (
              <ul className="checklist">
                {newSubtasks.map((item, index) => (
                  <li key={`new-${item}-${index}`}>
                    <span className="checklist-new-dot" aria-hidden="true" />
                    <span>{item}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${item}`}
                      onClick={() => setNewSubtasks((current) => current.filter((_, position) => position !== index))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <input
              value={checklistDraft}
              onChange={(event) => setChecklistDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addChecklistItem();
                }
              }}
              placeholder="Add checklist item"
              aria-label="Add checklist item"
            />
            <button type="button" className="ghost-link" onClick={addChecklistItem}>
              <UilPlus size="13" /> Add checklist item
            </button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <footer className="task-dialog-foot">
          <p>Use the title field to load an example task in this project.</p>
          <div className="task-dialog-actions">
            <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
