import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  UilCalendarAlt,
  UilCheckSquare,
  UilUser,
} from '@iconscout/react-unicons';
import TaskActionMenu from './TaskActionMenu';
import SubtasksMenu from './SubtasksMenu';
import AssigneeMenu from './AssigneeMenu';
import AssistantGlyph from '../common/AssistantGlyph';
import { MemberAvatar } from '../board/MemberAvatar';

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
      // API uses is_done; fallback to other common field names for compatibility
      done: task.subtasks.filter((subtask) => subtask.is_done ?? subtask.completed ?? subtask.is_completed ?? subtask.done).length,
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
  statuses = [],
  assignees = [],
  onOpenEdit,
  onRemoveTask,
  onOpenDetails,
  onDuplicateTask,
  onTaskStatusChange,
  onTaskPriorityChange,
  onAssigneeChange,
  onSubtasksChange,
  isOverlay = false,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [subtasksMenuOpen, setSubtasksMenuOpen] = useState(false);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const assigneeButtonRef = useRef(null);
  const [localSubtasks, setLocalSubtasks] = useState(task.subtasks);
  const currentStatusId = task.status_id ?? task.status?.id ?? task.status;

  // An unassigned task must not borrow the signed-in user's initials: the avatar
  // shows an empty person until somebody is picked from the assign menu.
  const hasAssigneeId = Object.prototype.hasOwnProperty.call(task, 'assignee_id') && task.assignee_id !== undefined;
  const assigneeId = hasAssigneeId ? task.assignee_id : task.assignee?.id ?? task.assignee ?? null;
  const assignee = assigneeId === null || assigneeId === undefined || assigneeId === ''
    ? null
    : assignees.find((member) => String(member.id) === String(assigneeId)) || null;
  // The member list may not contain the assignee any more (removed from the board), so
  // keep showing that the task is assigned instead of an empty person. A nested
  // `task.assignee` object can still carry the avatar.
  const isAssigned = assigneeId !== null && assigneeId !== undefined && assigneeId !== '';
  const assigneeLabel = assignee?.name
    || task.assignee_name
    || task.assignee?.full_name
    || task.assignee?.email
    || null;
  const assigneeProfile = assignee?.profile
    || (task.assignee && typeof task.assignee === 'object' ? task.assignee : null);

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

  const effectiveTask = localSubtasks ? { ...task, subtasks: localSubtasks } : task;
  const categoryName = getCategoryName(effectiveTask, categories);
  const categoryColor = getCategoryColor(effectiveTask, categories);
  const priority = normalizePriority(effectiveTask.priority);
  const { total, done } = subtaskStats(effectiveTask);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

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
      onClick={() => {
        if (!isDragging && !isOverlay) {
          setMenuOpen((prev) => !prev);
        }
      }}
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
          <div className="card-menu-container">
            <button
              type="button"
              className="card-menu"
              aria-label="Task details"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
            >
              •••
            </button>
            {menuOpen && !isOverlay && (
              <TaskActionMenu
                task={task}
                statuses={statuses}
                onClose={() => setMenuOpen(false)}
                onEdit={onOpenEdit}
                onDetails={onOpenDetails}
                onDelete={onRemoveTask}
                onDuplicate={onDuplicateTask}
                onStatusChange={onTaskStatusChange}
                onPriorityChange={onTaskPriorityChange}
              />
            )}
          </div>
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
          <div className="card-subtasks-container">
            <button
              type="button"
              className="card-meta-item-btn"
              title={total > 0 ? `${done} of ${total} subtasks done. Click to view.` : 'Subtasks. Click to add/view.'}
              aria-label="Subtasks menu"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setSubtasksMenuOpen((prev) => !prev);
              }}
            >
              <UilCheckSquare size="12" /> {total > 0 ? `${done}/${total}` : '0/0'}
            </button>
            {subtasksMenuOpen && !isOverlay && (
              <SubtasksMenu
                task={effectiveTask}
                onClose={() => setSubtasksMenuOpen(false)}
                onSubtaskToggled={(taskId, nextSubtasks) => {
                  setLocalSubtasks(nextSubtasks);
                  onSubtasksChange?.(taskId, nextSubtasks);
                }}
              />
            )}
          </div>
          <div className="card-assignee-container">
            <button
              ref={assigneeButtonRef}
              type="button"
              className={`card-assignee${isAssigned ? '' : ' is-empty'}`}
              title={isAssigned ? `Assigned to ${assigneeLabel || 'a member'} — click to change` : 'Unassigned — click to assign'}
              aria-label={isAssigned ? `Assigned to ${assigneeLabel || 'a board member'}. Change assignee` : 'Assign task'}
              aria-haspopup="menu"
              aria-expanded={assigneeMenuOpen}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setAssigneeMenuOpen((prev) => !prev);
              }}
            >
              {isAssigned && assigneeLabel
                ? <MemberAvatar profile={assigneeProfile} member={assignee?.member} name={assigneeLabel} size={18} />
                : <UilUser size="12" />}
            </button>
            {assigneeMenuOpen && !isOverlay && (
              <AssigneeMenu
                anchorRef={assigneeButtonRef}
                assignees={assignees}
                value={assigneeId}
                onClose={() => setAssigneeMenuOpen(false)}
                onSelect={(memberId) => {
                  setAssigneeMenuOpen(false);
                  onAssigneeChange?.(task.id, memberId, task);
                }}
              />
            )}
          </div>
          <button
            type="button"
            className="card-ai"
            title="Ask the AI assistant about this task"
            aria-label={`Ask the AI assistant about ${task.title}`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={askAssistant}
          >
            <AssistantGlyph size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
