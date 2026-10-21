import { dateKey } from '../../utils/dateUtils';

export default function CalendarGrid({ days, tasksByDate, onSelectDate, onSelectTask }) {
  return (
    <div className="calendar">
      <div className="timezone">GMT+3</div>
      <div className="day-headings">
        {days.map((day) => (
          <div key={dateKey(day)} className="day-heading">
            <span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <b>{day.getDate()}</b>
          </div>
        ))}
      </div>
      <div className="calendar-body">
        <div className="time-column">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index}>{index + 7} {index + 7 < 12 ? 'AM' : 'PM'}</span>
          ))}
        </div>
        <div className="day-columns">
          {days.map((day) => {
            const key = dateKey(day);
            return (
              <button className="day-column" key={key} onClick={() => onSelectDate(key)}>
                {(tasksByDate[key] || []).map((task) => (
                  <span
                    role="button"
                    tabIndex="0"
                    className={`calendar-task ${task.priority || 'medium'}`}
                    key={task.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectTask(task);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation();
                        onSelectTask(task);
                      }
                    }}
                  >
                    {task.title}
                  </span>
                ))}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
