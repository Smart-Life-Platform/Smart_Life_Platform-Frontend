import { useEffect, useRef, useState, useCallback } from 'react';
import { UilCheckSquare, UilSquareFull, UilPlus, UilTimes } from '@iconscout/react-unicons';
import { getSubtasks, updateSubtask, createSubtask } from '../../api/subtasksApi';

export default function SubtasksMenu({
  task,
  onClose,
  onSubtaskToggled,
  onAllSubtasksComplete,
}) {
  const menuRef = useRef(null);
  const [subtasks, setSubtasks] = useState(
    Array.isArray(task.subtasks) ? task.subtasks : []
  );
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState(new Set());

  const load = useCallback(async () => {
    if (!task.id) return;
    try {
      const data = await getSubtasks(task.id);
      setSubtasks(data);
    } catch {
      if (Array.isArray(task.subtasks)) {
        setSubtasks(task.subtasks);
      }
    } finally {
      setLoading(false);
    }
  }, [task.id, task.subtasks]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose?.();
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const toggle = async (subtask) => {
    const id = subtask.id;
    if (toggling.has(id)) return;
    const next = !subtask.is_done;

    // Optimistic local update
    const updated = subtasks.map((s) => (s.id === id ? { ...s, is_done: next } : s));
    setSubtasks(updated);
    setToggling((curr) => new Set([...curr, id]));
    onSubtaskToggled?.(task.id, updated);

    try {
      await updateSubtask(id, { is_done: next });

      // Check if all subtasks are now complete
      const allComplete = updated.every((s) => s.is_done ?? s.completed ?? s.is_completed ?? s.done);
      if (allComplete && updated.length > 0) {
        onAllSubtasksComplete?.(task.id);
      }
    } catch {
      // Revert on error
      const reverted = subtasks.map((s) => (s.id === id ? { ...s, is_done: !next } : s));
      setSubtasks(reverted);
      onSubtaskToggled?.(task.id, reverted);
    } finally {
      setToggling((curr) => {
        const nextSet = new Set(curr);
        nextSet.delete(id);
        return nextSet;
      });
    }
  };

  const addItem = async () => {
    const title = draft.trim();
    if (!title || adding) return;
    setAdding(true);
    try {
      const created = await createSubtask({
        task: task.id,
        title,
        is_done: false,
        position: subtasks.length + 1,
      });
      const updated = [...subtasks, created];
      setSubtasks(updated);
      setDraft('');
      onSubtaskToggled?.(task.id, updated);
    } catch {
      // Ignore error
    } finally {
      setAdding(false);
    }
  };

  const doneCount = subtasks.filter(
    (s) => s.is_done ?? s.completed ?? s.is_completed ?? s.done
  ).length;
  const totalCount = subtasks.length;

  return (
    <div
      ref={menuRef}
      className="subtasks-popup-menu"
      role="dialog"
      aria-label="Subtasks checklist"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="subtasks-popup-header">
        <div className="subtasks-popup-title-wrap">
          <span className="subtasks-popup-title">Subtasks</span>
          <span className="subtasks-popup-badge">
            {doneCount}/{totalCount}
          </span>
        </div>
        <button
          type="button"
          className="subtasks-popup-close"
          onClick={onClose}
          aria-label="Close"
        >
          <UilTimes size="14" />
        </button>
      </div>

      {totalCount > 0 && (
        <div className="subtasks-popup-progress">
          <span
            style={{
              width: totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}%` : '0%',
            }}
          />
        </div>
      )}

      <div className="subtasks-popup-body">
        {loading && subtasks.length === 0 && (
          <p className="subtasks-popup-empty">Loading subtasks…</p>
        )}

        {!loading && subtasks.length === 0 && (
          <p className="subtasks-popup-empty">No subtasks yet.</p>
        )}

        <ul className="subtasks-popup-list">
          {subtasks.map((subtask) => {
            const isDone = Boolean(subtask.is_done ?? subtask.completed ?? subtask.done);
            const isToggling = toggling.has(subtask.id);
            return (
              <li
                key={subtask.id}
                className={`subtasks-popup-item ${isDone ? 'is-completed' : ''}`}
              >
                <button
                  type="button"
                  className="subtasks-popup-checkbox"
                  onClick={() => toggle(subtask)}
                  disabled={isToggling}
                  title={isToggling ? 'Saving changes…' : isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isToggling ? (
                    <span className="subtask-spinner" aria-hidden="true" />
                  ) : isDone ? (
                    <UilCheckSquare size="16" />
                  ) : (
                    <UilSquareFull size="16" />
                  )}
                </button>
                <span className="subtasks-popup-item-title">{subtask.title}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="subtasks-popup-footer">
        <input
          type="text"
          className="subtasks-popup-input"
          placeholder="Add a new subtask…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <button
          type="button"
          className="subtasks-popup-add-btn"
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

