import { useNavigate } from 'react-router-dom';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  UilCalendarAlt,
  UilCheckSquare,
  UilEditAlt,
  UilInfoCircle,
  UilRobot,
  UilTrashAlt,
} from '@iconscout/react-unicons';

const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const PRIORITY_NAMES = ['low', 'medium', 'high', 'critical'];

const normalizePriority = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const text = String(value).toLowerCase();
  if (PRIORITY_NAMES.includes(text)) return text;
  // Older records store 1-based numbers (3 = high).
  return PRIORITY_NAMES[Number(text) - 1] || null;
};

const formatDate = (value) => {
  if (!value) return 'No due date';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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

/** Subtasks come either as counters or as an embedded list. */
const subtaskStats = (task) => {
  if (Array.isArray(task.subtasks)) {
    return {
      total: task.subtasks.length,
      done: task.subtasks.filter((subtask) => subtask.completed ?? subtask.is_completed ?? subtask.done).length,
    };
  }
  const total = Number(task.subtasks_count ?? task.subtask_count ?? 0) || 0;
  const done = Number(task.completed_subtasks_count ?? task.completed_subtasks ?? 0) || 0;
  return { total, done: Math.min(done, total) };
};

function PriorityFlag() {
  return (
    <svg
      width="11"
      height="11"
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

export default function TaskCard({
  task,
  categories = [],
  initials = 'U',
  onOpenEdit,
  onRemoveTask,
  onOpenDetails,
  isOverlay = false,
}) {
  const navigate = useNavigate();
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
  const priority = normalizePriority(task.priority);
  const { total, done } = subtaskStats(task);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleActionClick = (event, callback) => {
    event.stopPropagation();
    callback?.(task);
  };

  const askAssistant = (event) => {
    event.stopPropagation();
    const prompt = [
      `Task: "${task.title}".`,
      task.description ? task.description : '',
      priority ? `Priority: ${PRIORITY_LABELS[priority]}.` : '',
      task.due_date ? `Due ${task.due_date}.` : '',
      'Suggest the next steps and break the work into 3 concrete subtasks.',
    ].filter(Boolean).join(' ');

    navigate('/ai-assistant', { state: { assistantPrompt: prompt } });
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
          className="card-category"
          style={categoryColor ? { color: categoryColor } : undefined}
          title={categoryName}
        >
          {categoryName}
        </span>
        <div className="card-topline-right">
          {priority && (
            <span className={`card-priority priority-${priority}`} title={`${PRIORITY_LABELS[priority]} priority`}>
              <PriorityFlag />
              {PRIORITY_LABELS[priority]}
            </span>
          )}
          <button
            type="button"
            className="card-menu"
            aria-label="Task details"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => handleActionClick(event, onOpenDetails || onOpenEdit)}
          >
            •••
          </button>
        </div>
      </div>

      <h3>{task.title}</h3>
      <p>{task.description || 'No description yet.'}</p>

      {total > 0 && (
        <div
          className="card-progress"
          role="progressbar"
          aria-label="Subtasks completed"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="card-meta">
        <span className="card-meta-item">
          <UilCalendarAlt size="12" /> {formatDate(task.due_date)}
        </span>
        <div className="card-meta-right">
          {total > 0 && (
            <span className="card-meta-item" title={`${done} of ${total} subtasks done`}>
              <UilCheckSquare size="12" /> {done}/{total}
            </span>
          )}
          <span className="mini-avatar">{initials}</span>
          <button
            type="button"
            className="card-ai"
            title="Ask the AI assistant about this task"
            aria-label={`Ask the AI assistant about ${task.title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={askAssistant}
          >
            <UilRobot size="13" />
          </button>
        </div>
      </div>

      <div className="card-actions">
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => handleActionClick(event, onOpenEdit)}
        >
          <UilEditAlt size="13" /> Edit
        </button>
        {onOpenDetails && (
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => handleActionClick(event, onOpenDetails)}
            title="View details"
          >
            <UilInfoCircle size="13" />
          </button>
        )}
        <button
          type="button"
          aria-label="Delete task"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => handleActionClick(event, onRemoveTask)}
        >
          <UilTrashAlt size="13" />
        </button>
      </div>
    </article>
  );
}
