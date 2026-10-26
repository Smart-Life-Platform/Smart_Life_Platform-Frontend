import { dateKey } from '../../utils/dateUtils';
import { UilArrowDown, UilArrowUp, UilMinus } from '@iconscout/react-unicons';
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';

const HOURS_IN_DAY = 24;

function getUserTimeZone() {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith('timezone='));
  const cookieTimeZone = cookie ? decodeURIComponent(cookie.slice('timezone='.length)) : '';
  return cookieTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getTimeZoneLabel(timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    return parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT';
  } catch {
    return 'GMT';
  }
}

function calendarTitle(title = '') {
  return title.length > 18 ? `${title.slice(0, 17)}...` : title;
}

function priorityIcon(priority) {
  if (priority === 'high') return <UilArrowUp size="14" />;
  if (priority === 'low') return <UilArrowDown size="14" />;
  return <UilMinus size="14" />;
}

function taskTop(task, view = 'day', selectedHour = 0, selectedBlock = 0) {
  const [hours, minutes] = (task.due_time || '09:00').split(':').map(Number);
  const start = view === 'hour' ? selectedHour * 60 : view === '4hours' ? selectedBlock * 240 : 0;
  const range = view === 'hour' ? 60 : view === '4hours' ? 240 : HOURS_IN_DAY * 60;
  return `${Math.max(0, Math.min(range - 1, hours * 60 + minutes - start)) / range * 100}%`;
}

function taskLeft(lane = 0) {
  return `calc(${lane * 150}px + 8px)`;
}

function formatTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60) % HOURS_IN_DAY;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isToday(day) {
  return dateKey(day) === dateKey(new Date());
}

function currentTimePosition(view, selectedHour, selectedBlock) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const start = view === 'hour' ? selectedHour * 60 : view === '4hours' ? selectedBlock * 240 : 0;
  const range = view === 'hour' ? 60 : view === '4hours' ? 240 : HOURS_IN_DAY * 60;
  if (currentMinutes < start || currentMinutes >= start + range) return null;
  return `${((currentMinutes - start) / range) * 100}%`;
}

function timeFromDrop(active, over) {
  const activeRect = active.rect.current.translated;
  if (over.data.current.axis === 'horizontal') {
    const taskCenter = activeRect ? activeRect.top + activeRect.height / 2 : over.rect.top;
    const rangeMinutes = over.data.current.view === 'hour' ? 60 : over.data.current.view === '4hours' ? 240 : HOURS_IN_DAY * 60;
    const offset = over.data.current.view === 'hour'
      ? over.data.current.selectedHour * 60
      : over.data.current.view === '4hours'
        ? over.data.current.selectedBlock * 240
        : 0;
    const minutes = Math.max(0, Math.min(rangeMinutes - 1, ((taskCenter - over.rect.top) / over.rect.height) * rangeMinutes));
    const hour = Math.floor((minutes + offset) / 60);
    const minute = Math.min(59, Math.round((minutes + offset) % 60));
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  const taskCenter = activeRect ? activeRect.top + activeRect.height / 2 : over.rect.top;
  const rangeMinutes = over.data.current.view === 'hour' ? 60 : over.data.current.view === '4hours' ? 240 : HOURS_IN_DAY * 60;
  const offset = over.data.current.view === 'hour'
    ? over.data.current.selectedHour * 60
    : over.data.current.view === '4hours'
      ? over.data.current.selectedBlock * 240
      : 0;
  const minutes = Math.max(0, Math.min(rangeMinutes - 1, ((taskCenter - over.rect.top) / over.rect.height) * rangeMinutes));
  const totalMinutes = Math.floor(minutes + offset);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function dateTimePreview(active, over) {
  if (!over) return null;
  const time = timeFromDrop(active, over);
  return {
    date: over.data.current.date,
    time,
    hour: Number(time.slice(0, 2)),
  };
}

function DraggableTask({ task, onSelectTask, onAdvanceTaskStatus, canAdvance, lane, laneCount, compact, timeline, view, selectedHour, selectedBlock }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(task.id) });
  const style = {
    top: compact ? `${lane * 24 + 6}px` : timeline ? taskTop(task, view, selectedHour, selectedBlock) : taskTop(task),
    left: timeline
      ? taskLeft(lane)
      : `calc(${lane * 100 / laneCount}% + 5px)`,
    '--category-color': task.categoryColor || '#e8e8ff',
    right: timeline ? undefined : `calc(${(laneCount - lane - 1) * 100 / laneCount}% + 5px)`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  return <span ref={setNodeRef} role="button" tabIndex="0" title={task.title} className={`calendar-task${compact ? ' compact-task' : ''}${timeline ? ' timeline-task' : ''}${task.overdue ? ' overdue' : ''} status-${task.status_id ?? task.status?.id ?? task.status ?? 'unknown'} priority-${task.priority || 'medium'}`}
    style={style} {...listeners} {...attributes} onClick={(event) => { event.stopPropagation(); onSelectTask(task); }} onKeyDown={(event) => {
      if (event.key === 'Enter') {
        event.stopPropagation();
        onSelectTask(task);
      }
    }}><span className={`priority-marker priority-${task.priority || 'medium'}`} aria-label={`${task.priority || 'medium'} priority`}>{priorityIcon(task.priority)}</span>
    <span className="calendar-task-title">{calendarTitle(task.title)}</span>{canAdvance && !compact && <button type="button" className="task-status-button" aria-label="Move to next status" title="Next status" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => {
      event.stopPropagation();
      onAdvanceTaskStatus(task);
    }}>›</button>}<small>{(task.due_time || '09:00').slice(0, 5)}</small></span>;
}

function DayColumn({ day, tasks, onSelectDate, onSelectTask, onAdvanceTaskStatus, statuses, dropHour, timeSlots, hourStep, compact, timeline, view, selectedHour, selectedBlock }) {
  const key = dateKey(day);
  const { isOver, setNodeRef } = useDroppable({ id: key, data: { date: key, axis: 'vertical', view, selectedHour, selectedBlock } });

  if (timeline) return <div ref={setNodeRef} className={`day-timeline${isOver ? ' drag-over' : ''}`}>
    <div className="timeline-hours">{timeSlots.map((value) => {
      const hour = Math.floor(value / 60);
      const minute = value % 60;
      return <span className={minute % 10 === 0 ? 'timeline-major' : ''} key={value}>{formatTime(hour * 60 + minute)}</span>;
    })}</div>
    <div className="timeline-tasks" onClick={() => onSelectDate(key)}>
      {isToday(day) && currentTimePosition(view, selectedHour, selectedBlock) && <span className="current-time-line" style={{ top: currentTimePosition(view, selectedHour, selectedBlock) }} aria-label="Current time" />}
      {tasks.map((task) => {
        const taskHour = Number((task.due_time || '09:00').slice(0, 2));
        const overlapping = tasks.filter((item) => Number((item.due_time || '09:00').slice(0, 2)) === taskHour);
        return <DraggableTask key={task.id} task={task} lane={overlapping.indexOf(task)} laneCount={overlapping.length} timeline view={view} selectedHour={selectedHour} selectedBlock={selectedBlock} onSelectTask={onSelectTask} onAdvanceTaskStatus={onAdvanceTaskStatus}
        canAdvance={statuses.findIndex((status) => String(status.id) === String(task.status_id ?? task.status?.id ?? task.status)) < statuses.length - 1} />;
      })}
    </div>
  </div>;

  return <button ref={setNodeRef} className={`day-column${compact ? ' month-day' : ''}${compact && isToday(day) ? ' today' : ''}${isOver ? ' drag-over' : ''}`} onClick={() => onSelectDate(key)}>
    {dropHour !== null && <span className="drop-hour-indicator" style={{ '--drop-hour': dropHour / hourStep, '--hour-step': hourStep }} aria-hidden="true" />}
    {compact && <span className="month-day-number">{day.getDate()}</span>}
    {compact && tasks.length > 0 && <span className="month-task-count">{tasks.length === 1 ? '1 task' : `${tasks.length} tasks`}</span>}
    {tasks.slice(0, compact ? 4 : tasks.length).map((task, index) => {
      const taskHour = Number((task.due_time || '09:00').slice(0, 2));
      const sameHour = tasks.filter((item) => Number((item.due_time || '09:00').slice(0, 2)) === taskHour);
      return <DraggableTask key={task.id} task={task} compact={compact} lane={sameHour.indexOf(task)} laneCount={sameHour.length} onSelectTask={onSelectTask} onAdvanceTaskStatus={onAdvanceTaskStatus}
        canAdvance={statuses.findIndex((status) => String(status.id) === String(task.status_id ?? task.status?.id ?? task.status)) < statuses.length - 1} />;
    })}
    {compact && tasks.length > 4 && <span className="month-more">...</span>}
  </button>;
}

export default function CalendarGrid({ days, tasksByDate, onSelectDate, onSelectTask, onMoveTask, onAdvanceTaskStatus, statuses, view = 'week', selectedHour = 9, selectedBlock = 0 }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const timeZone = getUserTimeZone();
  const timeZoneLabel = getTimeZoneLabel(timeZone);
  const taskById = new Map(days.flatMap((day) => tasksByDate[dateKey(day)] || []).map((task) => [String(task.id), task]));
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const hourStep = view === '4hours' ? 4 : 1;
  const timeSlots = view === 'hour'
    ? Array.from({ length: 12 }, (_, index) => selectedHour * 60 + index * 5)
    : view === '4hours'
      ? Array.from({ length: 4 }, (_, index) => selectedBlock * 240 + index * 60)
    : view === 'day'
      ? Array.from({ length: HOURS_IN_DAY / 2 }, (_, index) => index * 120)
      : Array.from({ length: HOURS_IN_DAY / hourStep }, (_, index) => index * hourStep);
  const timeline = view === 'hour' || view === '4hours' || view === 'day';
  const compact = view === 'month';

  function handleDragStart({ active }) {
    setDraggedTask(taskById.get(String(active.id)) || null);
  }

  function handleDragMove({ active, over }) {
    setDragPreview(dateTimePreview(active, over));
  }

  function handleDragEnd({ active, over }) {
    setDragPreview(null);
    setDraggedTask(null);
    if (!over) return;
    const task = taskById.get(String(active.id));
    if (task) onMoveTask(task, over.data.current.date, timeFromDrop(active, over));
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragCancel={() => {
      setDragPreview(null);
      setDraggedTask(null);
    }} onDragEnd={handleDragEnd}>
    <div className="calendar">
      <div className="timezone">{timeZoneLabel}</div>
      {!timeline && <div className={`day-headings calendar-view-${view}`}>{(view === 'month' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : days).map((day) => typeof day === 'string'
        ? <div key={day} className="day-heading"><span>{day}</span></div>
        : <div key={dateKey(day)} className="day-heading"><span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span><b>{day.getDate()}</b></div>)}</div>}
      <div className="calendar-body">
        {!timeline && <div className={`time-column calendar-view-${view}`}>{timeSlots.map((hour) => <span key={hour}>{String(hour).padStart(2, '0')}:00</span>)}</div>}
        <div className={`day-columns calendar-view-${view}${timeline ? ' timeline-wrapper' : ''}`}>
          {days.map((day) => {
            const key = dateKey(day);
            const dayTasks = view === 'hour'
              ? (tasksByDate[key] || []).filter((task) => Number((task.due_time || '09:00').slice(0, 2)) === selectedHour)
              : view === '4hours'
                ? (tasksByDate[key] || []).filter((task) => {
                  const hour = Number((task.due_time || '09:00').slice(0, 2));
                  return hour >= selectedBlock * 4 && hour < (selectedBlock + 1) * 4;
                })
              : tasksByDate[key] || [];
            return <DayColumn key={key} day={day} tasks={dayTasks} onSelectDate={onSelectDate} onSelectTask={onSelectTask}
              onAdvanceTaskStatus={onAdvanceTaskStatus} statuses={statuses}
              dropHour={dragPreview?.date === key ? dragPreview.hour : null} timeSlots={timeSlots} hourStep={hourStep}
              compact={compact} timeline={timeline} view={view} selectedHour={selectedHour} selectedBlock={selectedBlock} />;
          })}
        </div>
      </div>
    </div>
    <DragOverlay>
      {draggedTask && <div className="calendar-drag-preview">
        <strong>{calendarTitle(draggedTask.title)}</strong>
        {dragPreview && <span>{dragPreview.date} · {dragPreview.time}</span>}
      </div>}
    </DragOverlay>
    </DndContext>
  );
}
