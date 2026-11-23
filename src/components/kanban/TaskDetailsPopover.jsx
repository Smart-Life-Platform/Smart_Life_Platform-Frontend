import { useCallback, useEffect, useState } from 'react';
import { UilTimes, UilCheckSquare, UilSquareFull, UilPlus } from '@iconscout/react-unicons';
import TaskDetailsBadges from './TaskDetailsBadges';
import TaskDetailsMeta from './TaskDetailsMeta';
import TaskDetailsActions from './TaskDetailsActions';
import { getSubtasks, updateSubtask, createSubtask, deleteSubtask } from '../../api/subtasksApi';

export default function TaskDetailsPopover({
  task,
  statuses = [],
  categories = [],
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (!task) return null;

  const currentStatusId = task.status_id ?? task.status?.id ?? task.status;
  const currentStatus =
    statuses.find((s) => String(s.id) === String(currentStatusId)) ||
    statuses.find((s) => s.name?.toLowerCase() === (task.status_name || '').toLowerCase());

  const currentCategoryId = task.category_id ?? task.category?.id ?? task.category;
  const currentCategory = categories.find((c) => String(c.id) === String(currentCategoryId));

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="task-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">TASK DETAILS</p>
            <h2>{task.title}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <UilTimes size="20" />
          </button>
        </div>

        <div className="task-popover-content">
          <TaskDetailsBadges
            status={currentStatus}
            category={currentCategory}
            priority={task.priority}
          />

          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: '11px', color: 'var(--color-secondary)' }}>Description</h4>
            <p className="task-popover-desc">{task.description || 'No description for this task.'}</p>
          </div>

          <TaskDetailsMeta
            dueDate={task.due_date}
            dueTime={task.due_time}
            currentStatusId={currentStatusId}
            statuses={statuses}
            onStatusChange={onStatusChange ? (nextStatus) => onStatusChange(task.id, nextStatus) : null}
          />

          <SubtaskChecklist taskId={task.id} initialSubtasks={task.subtasks} />

          <TaskDetailsActions
            onEdit={() => {
              onClose();
              onEdit?.(task);
            }}
            onDelete={() => {
              onClose();
              onDelete?.(task);
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Inline checklist inside the task details popover. */
function SubtaskChecklist({ taskId, initialSubtasks }) {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState(new Set());

  const load = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await getSubtasks(taskId);
      setSubtasks(data);
    } catch {
      // If API call fails but we have embedded subtasks, show those
      if (Array.isArray(initialSubtasks)) setSubtasks(initialSubtasks);
    } finally {
      setLoading(false);
    }
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Use embedded data immediately while API loads
    if (Array.isArray(initialSubtasks) && initialSubtasks.length > 0) {
      setSubtasks(initialSubtasks);
      setLoading(false);
    }
    load();
  }, [load, initialSubtasks]);

  const toggle = async (subtask) => {
    const id = subtask.id;
    if (toggling.has(id)) return;
    const next = !subtask.is_done;
    // Optimistic update
    setSubtasks((current) =>
      current.map((s) => (s.id === id ? { ...s, is_done: next } : s))
    );
    setToggling((current) => new Set([...current, id]));
    try {
      await updateSubtask(id, { is_done: next });
    } catch {
      // Revert on error
      setSubtasks((current) =>
        current.map((s) => (s.id === id ? { ...s, is_done: !next } : s))
      );
    } finally {
      setToggling((current) => {
        const updated = new Set(current);
        updated.delete(id);
        return updated;
      });
    }
  };

  const addItem = async () => {
    const title = draft.trim();
    if (!title || adding) return;
    setAdding(true);
    try {
      const created = await createSubtask({
        task: taskId,
        title,
        is_done: false,
        position: subtasks.length + 1,
      });
      setSubtasks((current) => [...current, created]);
      setDraft('');
    } catch {
      // silently ignore
    } finally {
      setAdding(false);
    }
  };

  const removeItem = async (subtask) => {
    setSubtasks((current) => current.filter((s) => s.id !== subtask.id));
    try {
      await deleteSubtask(subtask.id);
    } catch {
      setSubtasks((current) => [...current, subtask]);
    }
  };

  const done = subtasks.filter((s) => s.is_done).length;
  const total = subtasks.length;

  return (
    <div className="subtask-checklist">
      <h4 className="subtask-checklist-heading">
        Subtasks
        {total > 0 && (
          <span className="subtask-checklist-count">
            {done}/{total}
          </span>
        )}
      </h4>

      {total > 0 && (
        <div
          className="subtask-progress-bar"
          role="progressbar"
          aria-label="Subtasks completed"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <span style={{ width: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%' }} />
        </div>
      )}

      {loading && subtasks.length === 0 && (
        <p className="subtask-empty">Loading…</p>
      )}

      {!loading && subtasks.length === 0 && (
        <p className="subtask-empty">No subtasks yet.</p>
      )}

      <ul className="subtask-list">
        {subtasks.map((subtask) => {
          const isToggling = toggling.has(subtask.id);
          return (
            <li key={subtask.id} className={`subtask-item${subtask.is_done ? ' subtask-done' : ''}`}>
              <button
                type="button"
                className="subtask-toggle"
                onClick={() => toggle(subtask)}
                aria-label={subtask.is_done ? 'Mark as not done' : 'Mark as done'}
                title={isToggling ? 'Saving changes…' : subtask.is_done ? 'Mark as not done' : 'Mark as done'}
                disabled={isToggling}
              >
                {isToggling ? (
                  <span className="subtask-spinner" aria-hidden="true" />
                ) : subtask.is_done ? (
                  <UilCheckSquare size="16" />
                ) : (
                  <UilSquareFull size="16" />
                )}
              </button>
              <span className="subtask-title">{subtask.title}</span>
              <button
                type="button"
                className="subtask-delete"
                onClick={() => removeItem(subtask)}
                aria-label={`Delete ${subtask.title}`}
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      <div className="subtask-add-row">
        <input
          className="subtask-add-input"
          value={draft}
          placeholder="Add subtask…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addItem(); }
          }}
        />
        <button
          type="button"
          className="subtask-add-btn"
          onClick={addItem}
          disabled={!draft.trim() || adding}
          aria-label="Add subtask"
        >
          <UilPlus size="14" />
        </button>
      </div>
    </div>
  );
}
