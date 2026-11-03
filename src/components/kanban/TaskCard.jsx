import { useDraggable, useDroppable } from '@dnd-kit/core';
import { UilCalendarAlt, UilEditAlt, UilTrashAlt, UilInfoCircle } from '@iconscout/react-unicons';

const getCategoryName = (task, categories = []) => {
  if (task.category_name) return task.category_name;
  const categoryId = task.category_id ?? task.category?.id ?? task.category;
  const match = categories.find((item) => String(item.id) === String(categoryId));
  return match?.name || task.category?.name || 'No category';
};

const getCategoryColor = (task, categories = []) => {
  if (task.category_color) return task.category_color;
  const categoryId = task.category_id ?? task.category?.id ?? task.category;
  const match = categories.find((item) => String(item.id) === String(categoryId));
  return match?.color || task.category?.color || null;
};

export default function TaskCard({
  task,
  categories = [],
  initials = 'U',
  onOpenEdit,
  onRemoveTask,
  onOpenDetails,
  isOverlay = false,
}) {
  const currentStatusId = task.status_id ?? task.status?.id ?? task.status;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: 'task',
      task,
      statusId: currentStatusId,
    },
    disabled: isOverlay,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `task-drop-${task.id}`,
    data: {
      type: 'task',
      task,
      statusId: currentStatusId,
    },
    disabled: isOverlay,
  });

  const setNodeRef = (node) => {
    setDragRef(node);
    setDropRef(node);
  };

  const style = transform && !isOverlay
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.35 : 1,
      }
    : undefined;

  const categoryName = getCategoryName(task, categories);
  const categoryColor = getCategoryColor(task, categories);
  const priorityClass = `priority-${task.priority || 'medium'}`;

  const handleActionClick = (e, callback) => {
    e.stopPropagation();
    callback?.(task);
  };

  return (
    <article
      ref={setNodeRef}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      className={`board-card ${isOverlay ? 'board-drag-overlay-card' : ''} ${isDragging ? 'is-dragging' : ''} ${isOver ? 'drag-over' : ''}`}
      style={style}
    >
      <div className="card-topline">
        <span
          style={categoryColor ? { borderLeft: `3px solid ${categoryColor}`, paddingLeft: '5px' } : undefined}
        >
          {categoryName}
        </span>
        <button
          type="button"
          aria-label="Task details"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => handleActionClick(e, onOpenDetails || onOpenEdit)}
        >
          •••
        </button>
      </div>

      <h3>{task.title}</h3>
      <p>{task.description || 'Немає опису'}</p>

      <div className="card-meta">
        <span>
          <UilCalendarAlt size="12" /> {task.due_date || 'Немає дати'}
        </span>
        <span className={`priority-label ${priorityClass}`}>
          {task.priority || 'medium'}
        </span>
        <span className="mini-avatar">{initials}</span>
      </div>

      <div className="card-actions">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => handleActionClick(e, onOpenEdit)}
        >
          <UilEditAlt size="13" /> Edit
        </button>
        {onOpenDetails && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => handleActionClick(e, onOpenDetails)}
            title="View details"
          >
            <UilInfoCircle size="13" />
          </button>
        )}
        <button
          type="button"
          aria-label="Delete task"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => handleActionClick(e, onRemoveTask)}
        >
          <UilTrashAlt size="13" />
        </button>
      </div>
    </article>
  );
}

