import { useDraggable, useDroppable } from '@dnd-kit/core';
import { UilPlus } from '@iconscout/react-unicons';
import TaskCard from './TaskCard';
import DropZone from './DropZone';

export default function KanbanColumn({
  status,
  tasks = [],
  categories = [],
  statuses = [],
  initials = 'U',
  loading = false,
  onOpenCreate,
  onOpenEdit,
  onRemoveTask,
  onOpenDetails,
  isDraggingAny = false,
}) {
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
  });

  const columnStyle = colTransform
    ? {
        transform: `translate3d(${colTransform.x}px, ${colTransform.y}px, 0)`,
        opacity: isColDragging ? 0.45 : 1,
      }
    : undefined;

  return (
    <section
      ref={setColumnDropRef}
      className={`board-column${isOver ? ' drag-over' : ''}${isColDragging ? ' is-column-dragging' : ''}`}
      style={columnStyle}
    >
      <div className="column-heading">
        <div
          ref={setColDragRef}
          {...colListeners}
          {...colAttributes}
          className="column-drag-handle column-header-title"
          title="Drag to reorder status (e.g. swap start with plain)"
        >
          <span className="column-grip-icon" aria-hidden="true">⋮⋮</span>
          <span className="status-dot" style={status.color ? { background: status.color } : undefined} />
          <strong>{status.name}</strong>
          <b>{tasks.length}</b>
        </div>
        <button
          type="button"
          aria-label="Add task to column"
          onClick={() => onOpenCreate?.(status)}
        >
          <UilPlus size="14" />
        </button>
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
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              categories={categories}
              statuses={statuses}
              initials={initials}
              onOpenEdit={onOpenEdit}
              onRemoveTask={onRemoveTask}
              onOpenDetails={onOpenDetails}
            />
          ))
        )}

        {tasks.length > 0 && isDraggingAny && (
          <DropZone status={status} position="bottom" />
        )}

        <button
          type="button"
          className="column-add"
          onClick={() => onOpenCreate?.(status)}
        >
          + Add task
        </button>
      </div>
    </section>
  );
}
