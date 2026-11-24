import { useEffect, useRef, useState } from 'react';
import {
  UilEditAlt,
  UilCheckCircle,
  UilCopy,
  UilTrashAlt,
  UilInfoCircle,
  UilAngleRight,
} from '@iconscout/react-unicons';

function PriorityIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 21V4" />
      <path d="M5 4.5h11.5l-2.4 3.9 2.4 3.9H5" />
    </svg>
  );
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'var(--color-secondary)' },
  { value: 'medium', label: 'Medium', color: 'var(--color-yellow)' },
  { value: 'high', label: 'High', color: 'var(--color-red)' },
  { value: 'critical', label: 'Critical', color: 'var(--color-red)' },
];

export default function TaskActionMenu({
  task,
  statuses = [],
  onClose,
  onEdit,
  onDetails,
  onDelete,
  onDuplicate,
  onStatusChange,
  onPriorityChange,
}) {
  const menuRef = useRef(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'status' | 'priority' | null

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

  const currentStatusId = task.status_id ?? task.status?.id ?? task.status;
  const currentPriority = String(task.priority || 'medium').toLowerCase();

  return (
    <div
      ref={menuRef}
      className="task-action-menu"
      role="menu"
      aria-label="Task options"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="task-action-menu-header">
        <span className="task-action-menu-title" title={task.title}>
          {task.title}
        </span>
      </div>

      <div className="task-action-menu-items">
        {onEdit && (
          <button
            type="button"
            className="task-action-item"
            onClick={() => {
              onClose?.();
              onEdit?.(task);
            }}
          >
            <span className="task-action-icon"><UilEditAlt size="15" /></span>
            <span>Edit task</span>
          </button>
        )}

        {onDetails && (
          <button
            type="button"
            className="task-action-item"
            onClick={() => {
              onClose?.();
              onDetails?.(task);
            }}
          >
            <span className="task-action-icon"><UilInfoCircle size="15" /></span>
            <span>Task details</span>
          </button>
        )}

        {statuses.length > 0 && onStatusChange && (
          <div
            className="task-action-item-parent"
            onMouseEnter={() => setActiveSubmenu('status')}
            onMouseLeave={() => setActiveSubmenu((curr) => (curr === 'status' ? null : curr))}
          >
            <button
              type="button"
              className="task-action-item has-submenu"
              onClick={() => setActiveSubmenu((curr) => (curr === 'status' ? null : 'status'))}
            >
              <span className="task-action-icon"><UilCheckCircle size="15" /></span>
              <span>Change status</span>
              <span className="task-action-arrow"><UilAngleRight size="15" /></span>
            </button>

            {activeSubmenu === 'status' && (
              <div className="task-action-submenu" role="menu">
                {statuses.map((s) => {
                  const isCurrent = String(s.id) === String(currentStatusId);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`task-action-item ${isCurrent ? 'is-selected' : ''}`}
                      onClick={() => {
                        onClose?.();
                        onStatusChange?.(task.id, s);
                      }}
                    >
                      <span
                        className="status-dot"
                        style={s.color ? { background: s.color } : undefined}
                      />
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onPriorityChange && (
          <div
            className="task-action-item-parent"
            onMouseEnter={() => setActiveSubmenu('priority')}
            onMouseLeave={() => setActiveSubmenu((curr) => (curr === 'priority' ? null : curr))}
          >
            <button
              type="button"
              className="task-action-item has-submenu"
              onClick={() => setActiveSubmenu((curr) => (curr === 'priority' ? null : 'priority'))}
            >
              <span className="task-action-icon"><PriorityIcon /></span>
              <span>Change priority</span>
              <span className="task-action-arrow"><UilAngleRight size="15" /></span>
            </button>

            {activeSubmenu === 'priority' && (
              <div className="task-action-submenu" role="menu">
                {PRIORITY_OPTIONS.map((p) => {
                  const isCurrent = currentPriority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      className={`task-action-item ${isCurrent ? 'is-selected' : ''}`}
                      onClick={() => {
                        onClose?.();
                        onPriorityChange?.(task.id, p.value);
                      }}
                    >
                      <span className="status-dot" style={{ background: p.color }} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onDuplicate && (
          <button
            type="button"
            className="task-action-item"
            onClick={() => {
              onClose?.();
              onDuplicate?.(task);
            }}
          >
            <span className="task-action-icon"><UilCopy size="15" /></span>
            <span>Duplicate task</span>
          </button>
        )}

        <div className="task-action-divider" />

        {onDelete && (
          <button
            type="button"
            className="task-action-item is-danger"
            onClick={() => {
              onClose?.();
              onDelete?.(task);
            }}
          >
            <span className="task-action-icon"><UilTrashAlt size="15" /></span>
            <span>Delete task</span>
          </button>
        )}
      </div>
    </div>
  );
}

