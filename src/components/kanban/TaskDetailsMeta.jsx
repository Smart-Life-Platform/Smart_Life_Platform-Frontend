import { UilCalendarAlt, UilClock } from '@iconscout/react-unicons';
import Dropdown from '../common/Dropdown';

export default function TaskDetailsMeta({
  dueDate,
  dueTime,
  currentStatusId,
  statuses = [],
  onStatusChange,
}) {
  const statusOptions = statuses.map((status) => ({ value: String(status.id), label: status.name }));

  return (
    <>
      <div className="task-popover-meta">
        <div>
          <span>Due Date</span>
          <p style={{ margin: 0 }}>
            <UilCalendarAlt size="12" /> {dueDate || 'Not set'}
          </p>
        </div>
        <div>
          <span>Due Time</span>
          <p style={{ margin: 0 }}>
            <UilClock size="12" /> {dueTime || 'Not set'}
          </p>
        </div>
      </div>

      {onStatusChange && (
        <div className="task-popover-status">
          <span>Move to status</span>
          <Dropdown
            value={currentStatusId ? String(currentStatusId) : ''}
            options={statusOptions}
            placeholder="Select status"
            ariaLabel="Move to status"
            onChange={(value) => {
              const nextStatus = statuses.find((status) => String(status.id) === value);
              if (nextStatus) onStatusChange(nextStatus);
            }}
          />
        </div>
      )}
    </>
  );
}
