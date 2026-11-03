import { UilTimes } from '@iconscout/react-unicons';
import TaskDetailsBadges from './TaskDetailsBadges';
import TaskDetailsMeta from './TaskDetailsMeta';
import TaskDetailsActions from './TaskDetailsActions';

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
            <p className="task-popover-desc">{task.description || 'Немає опису для цієї задачі.'}</p>
          </div>

          <TaskDetailsMeta
            dueDate={task.due_date}
            dueTime={task.due_time}
            currentStatusId={currentStatusId}
            statuses={statuses}
            onStatusChange={onStatusChange ? (nextStatus) => onStatusChange(task.id, nextStatus) : null}
          />

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
