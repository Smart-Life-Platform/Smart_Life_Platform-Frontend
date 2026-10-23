import { dateKey } from '../../utils/dateUtils';
import { UilArrowDown, UilArrowUp, UilMinus } from '@iconscout/react-unicons';

const HOURS_IN_DAY = 24;

function priorityIcon(priority) {
  if (priority === 'high') return <UilArrowUp size="14" />;
  if (priority === 'low') return <UilArrowDown size="14" />;
  return <UilMinus size="14" />;
}

function taskTop(task) {
  const [hours, minutes] = (task.due_time || '09:00').split(':').map(Number);
  return `${Math.max(0, Math.min(HOURS_IN_DAY * 60 - 30, hours * 60 + minutes)) / (HOURS_IN_DAY * 60) * 100}%`;
}

export default function CalendarGrid({ days, tasksByDate, onSelectDate, onSelectTask }) {
  return (
    <div className="calendar">
      <div className="timezone">GMT+3</div>
      <div className="day-headings">{days.map((day) => <div key={dateKey(day)} className="day-heading"><span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span><b>{day.getDate()}</b></div>)}</div>
      <div className="calendar-body">
        <div className="time-column">{Array.from({ length: 24 }, (_, index) => <span key={index}>{String(index).padStart(2, '0')}:00</span>)}</div>
        <div className="day-columns">
          {days.map((day) => {
            const key = dateKey(day);
            return <button className="day-column" key={key} onClick={() => onSelectDate(key)}>
              {(tasksByDate[key] || []).map((task) => <span role="button" tabIndex="0" className={`calendar-task status-${task.status_id || task.status?.id || 1} priority-${task.priority || 'medium'}`}
                style={{ top: taskTop(task) }} key={task.id} onClick={(event) => { event.stopPropagation(); onSelectTask(task); }} onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.stopPropagation(); onSelectTask(task);
                  }
                }}><span className="priority-icon">{priorityIcon(task.priority)}</span>
                {task.title}<small>{(task.due_time || '09:00').slice(0, 5)}</small></span>)
              }
            </button>;
          })}
        </div>
      </div>
    </div>
  );
}
