import { UilCalendarAlt, UilClock } from '@iconscout/react-unicons';

export default function TaskDetailsMeta({
  dueDate,
  dueTime,
  currentStatusId,
  statuses = [],
  onStatusChange,
}) {
  return (
    <>
      <div className="task-popover-meta">
        <div>
          <span>Due Date</span>
          <p style={{ margin: 0 }}>
            <UilCalendarAlt size="12" /> {dueDate || 'Не вказано'}
          </p>
        </div>
        <div>
          <span>Due Time</span>
          <p style={{ margin: 0 }}>
            <UilClock size="12" /> {dueTime || 'Не вказано'}
          </p>
        </div>
      </div>

      {onStatusChange && (
        <div style={{ marginTop: '8px' }}>
          <label
            style={{
              fontSize: '10px',
              color: 'var(--color-secondary)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Move to status
            <select
              value={currentStatusId || ''}
              onChange={(e) => {
                const nextStatus = statuses.find((s) => String(s.id) === e.target.value);
                if (nextStatus) {
                  onStatusChange(nextStatus);
                }
              }}
              style={{ marginTop: '4px', width: '100%', padding: '6px' }}
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </>
  );
}

