import { UilCalendarAlt, UilClock, UilEditAlt, UilTimes, UilTagAlt } from '@iconscout/react-unicons';

const PRIORITY_LABELS = { low: 'Low priority', medium: 'Normal priority', high: 'High priority', critical: 'Critical priority' };

const formatDate = (value) => {
  if (!value) return 'No date';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const formatTime = (value) => (value ? String(value).slice(0, 5) : 'All day');

export default function CalendarEventDetails({ task, statuses = [], categories = [], onClose, onEdit, onDelete }) {
  const statusId = task.status_id ?? task.status?.id ?? task.status;
  const status = statuses.find((item) => String(item.id) === String(statusId));
  const categoryId = task.category_id ?? task.category?.id ?? task.category;
  const category = categories.find((item) => String(item.id) === String(categoryId));
  const priority = String(task.priority || 'medium').toLowerCase();

  return (
    <aside className="calendar-event-details">
      <header>
        <p className="eyebrow">EVENT DETAILS</p>
        <button type="button" className="close-button" aria-label="Close details" onClick={onClose}><UilTimes size="18" /></button>
      </header>

      <h2>{task.title}</h2>
      <p className="calendar-event-status">
        <i className="status-dot" style={{ background: status?.color || 'var(--color-secondary)' }} />
        {status?.name || task.status_name || 'No status'}
      </p>

      {task.description && <p className="calendar-event-description">{task.description}</p>}

      <dl className="calendar-event-meta">
        <dt><UilCalendarAlt size="14" /> Date</dt>
        <dd>{formatDate(task.due_date)}</dd>
        <dt><UilClock size="14" /> Time</dt>
        <dd>{formatTime(task.due_time)}</dd>
        {category && (
          <>
            <dt><UilTagAlt size="14" /> Category</dt>
            <dd>{category.name}</dd>
          </>
        )}
        <dt>Priority</dt>
        <dd className={`priority-${priority}`}>{PRIORITY_LABELS[priority] || priority}</dd>
      </dl>

      <div className="calendar-event-actions">
        <button type="button" className="primary-button" onClick={() => onEdit(task)}>
          <UilEditAlt size="15" /> Edit event
        </button>
        {onDelete && (
          <button type="button" className="danger-button" onClick={() => onDelete(task)}>Delete</button>
        )}
      </div>
    </aside>
  );
}
