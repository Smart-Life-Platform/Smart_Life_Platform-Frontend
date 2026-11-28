import { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { UilPlus } from '@iconscout/react-unicons';
import TaskCard from './TaskCard';
import DropZone from './DropZone';
import QuickAddTask from '../tasks/QuickAddTask';
import ColorPalette from '../common/ColorPalette';

export default function KanbanColumn({
  status,
  tasks = [],
  categories = [],
  statuses = [],
  assignees = [],
  loading = false,
  readOnly = false,
  canMoveLeft = false,
  canMoveRight = false,
  isLastColumn = false,
  onOpenCreate,
  onOpenEdit,
  onRemoveTask,
  onOpenDetails,
  onDuplicateTask,
  onTaskStatusChange,
  onTaskPriorityChange,
  onAssigneeChange,
  onRenameColumn,
  onChangeColumnColor,
  onMoveColumn,
  onArchiveColumn,
  quickAddOpen = false,
  onOpenQuickAdd,
  onCloseQuickAdd,
  onQuickCreate,
  onOpenFullTask,
  isDraggingAny = false,
  onAllSubtasksComplete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const menuRef = useRef(null);

  const subtaskStats = (task) => {
    if (Array.isArray(task.subtasks)) {
      return {
        total: task.subtasks.length,
        done: task.subtasks.filter((subtask) => subtask.is_done ?? subtask.completed ?? subtask.is_completed ?? subtask.done).length,
      };
    }
    const total = Number(task.subtasks_count ?? task.subtask_count ?? 0) || 0;
    const done = Number(task.completed_subtasks_count ?? task.completed_subtasks ?? 0) || 0;
    return { total, done: Math.min(done, total) };
  };

  // Sort tasks: completed tasks at the bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    const aStats = subtaskStats(a);
    const bStats = subtaskStats(b);
    const aComplete = aStats.total > 0 && aStats.done === aStats.total;
    const bComplete = bStats.total > 0 && bStats.done === bStats.total;
    if (aComplete && !bComplete) return 1;
    if (!aComplete && bComplete) return -1;
    return 0;
  });

  const { isOver, setNodeRef: setColumnDropRef } = useDroppable({
    id: `column-${status.id}`,
    data: {
      type: 'column',
      status,
    },
  });

  const {
    attributes: colAttributes,
    listeners: colListeners,
    setNodeRef: setColDragRef,
    transform: colTransform,
    isDragging: isColDragging,
  } = useDraggable({
    id: `status-${status.id}`,
    data: {
      type: 'column',
      status,
    },
    disabled: readOnly,
  });

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setColorOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setColorOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    setColorOpen(false);
  };

  const columnStyle = colTransform
    ? {
        transform: `translate3d(${colTransform.x}px, ${colTransform.y}px, 0)`,
        opacity: isColDragging ? 0.45 : 1,
      }
    : undefined;

  return (
    <section
      ref={setColumnDropRef}
      className={`board-column${isOver ? ' drag-over' : ''}${isColDragging ? ' is-column-dragging' : ''}${isLastColumn ? ' is-last-column' : ''}`}
      style={columnStyle}
    >
      <div className="column-heading">
        <div
          ref={setColDragRef}
          {...colListeners}
          {...colAttributes}
          className="column-drag-handle column-header-title"
          title={readOnly ? undefined : 'Drag to reorder status'}
        >
          <span className="column-grip-icon" aria-hidden="true">⋮⋮</span>
          <span className="status-dot" style={status.color ? { background: status.color } : undefined} />
          <strong>{status.name}</strong>
          <b style={status.color ? { color: status.color } : undefined}>{tasks.length}</b>
        </div>

        <div className="column-heading-actions" ref={menuRef}>
          {!readOnly && (
            <button
              type="button"
              className="column-menu-button"
              aria-label={`Actions for ${status.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((open) => !open);
                setColorOpen(false);
              }}
            >
              •••
            </button>
          )}

          {menuOpen && (
            <div className="column-menu-list" role="menu" aria-label={`${status.name} actions`}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  onRenameColumn?.(status);
                }}
              >
                Rename column
              </button>
              <button
                type="button"
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={colorOpen}
                onClick={() => setColorOpen((open) => !open)}
              >
                Change color
                <span className="column-menu-caret" aria-hidden="true">›</span>
              </button>

              <div className="column-menu-separator" aria-hidden="true" />

              <button
                type="button"
                role="menuitem"
                disabled={!canMoveLeft}
                onClick={() => {
                  closeMenu();
                  onMoveColumn?.(status, -1);
                }}
              >
                Move column left
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!canMoveRight}
                onClick={() => {
                  closeMenu();
                  onMoveColumn?.(status, 1);
                }}
              >
                Move column right
              </button>

              <div className="column-menu-separator" aria-hidden="true" />

              <button
                type="button"
                role="menuitem"
                className="is-danger"
                onClick={() => {
                  closeMenu();
                  onArchiveColumn?.(status);
                }}
              >
                Archive column
              </button>

              {colorOpen && (
                <div className="column-color-popover" role="group" aria-label="Column color">
                  <ColorPalette
                    label="Column color"
                    value={status.color}
                    onChange={(color) => {
                      closeMenu();
                      onChangeColumnColor?.(status, color);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            aria-label="Add task to column"
            title={readOnly ? 'View-only access' : 'Add task'}
            onClick={() => onOpenQuickAdd?.(status)}
            disabled={readOnly}
          >
            <UilPlus size="14" />
          </button>
        </div>
      </div>

      <div className="column-cards">
        {loading && !tasks.length && (
          <p className="muted" style={{ padding: '8px', fontSize: '9px' }}>
            Loading tasks...
          </p>
        )}

        {tasks.length === 0 ? (
          <DropZone status={status} position="empty" />
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              categories={categories}
              statuses={statuses}
              assignees={assignees}
              statusColor={status.color}
              isLastColumn={isLastColumn}
              onOpenEdit={onOpenEdit}
              onRemoveTask={onRemoveTask}
              onOpenDetails={onOpenDetails}
              onDuplicateTask={onDuplicateTask}
              onTaskStatusChange={onTaskStatusChange}
              onTaskPriorityChange={onTaskPriorityChange}
              onAssigneeChange={onAssigneeChange}
              onAllSubtasksComplete={onAllSubtasksComplete}
              readOnly={readOnly}
            />
          ))
        )}

        {tasks.length > 0 && isDraggingAny && (
          <DropZone status={status} position="bottom" />
        )}

        <button
          type="button"
          className="column-add"
          onClick={() => onOpenQuickAdd?.(status)}
          disabled={readOnly}
        >
          + Add task
        </button>
      </div>

      {quickAddOpen && !readOnly && (
        <QuickAddTask
          status={status}
          onClose={onCloseQuickAdd}
          onCreate={async (payload) => {
            await onQuickCreate?.(payload, status);
            onCloseQuickAdd?.();
          }}
          onOpenFullDetails={() => {
            onCloseQuickAdd?.();
            onOpenFullTask?.(status);
          }}
        />
      )}
    </section>
  );
}
