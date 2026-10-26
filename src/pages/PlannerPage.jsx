import { useEffect, useState } from 'react';
import { UilAngleLeft, UilAngleRight, UilCalendarAlt, UilEditAlt, UilTrashAlt, UilPlus, UilArrowRight } from '@iconscout/react-unicons';
import CalendarGrid from '../components/calendar/CalendarGrid';
import TaskFilters from '../components/tasks/TaskFilters';
import { useTaskContext } from '../context/TaskContext';
import { formatMonthYear } from '../utils/dateUtils';
import useCalendar from '../hooks/useCalendar';
import { tasksByDate, useFilteredTasks } from '../hooks/useTasks';
import TaskForm from '../components/tasks/TaskForm';
import { dateKey } from '../utils/dateUtils';

const statusName = (task, statuses) => task.status_name || statuses.find((item) => String(item.id) === String(task.status_id ?? task.status?.id ?? task.status))?.name || task.status?.name || 'Unknown status';
const categoryName = (task, categories) => task.category_name || categories.find((item) => String(item.id) === String(task.category_id ?? task.category?.id ?? task.category))?.name || task.category?.name || 'No category';
const categoryColor = (task, categories) => task.category_color || task.category?.color || task.category?.color_code ||
  categories.find((item) => String(item.id) === String(task.category_id ?? task.category?.id ?? task.category))?.color ||
  categories.find((item) => String(item.id) === String(task.category_id ?? task.category?.id ?? task.category))?.color_code || '';
const isDone = (task, statuses) => {
  const status = task.status_name || task.status?.name || (typeof task.status === 'string' ? task.status : '') ||
    statuses.find((item) => String(item.id) === String(task.status_id ?? task.status?.id ?? task.status))?.name || '';
  return status.toLowerCase() === 'done';
};
export default function PlannerPage() {
  const {
    tasks, overdueTasks, calendarTasks, statuses, categories, priorities, loading, loadTasks, loadCalendarTasks, loadMetadata,
    createTask, updateTask, deleteTask,
  } = useTaskContext();
  const [calendarView, setCalendarView] = useState('week');
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedBlock, setSelectedBlock] = useState(Math.floor(new Date().getHours() / 4));
  const { week, days, shiftWeek, goToDate, todayKey } = useCalendar(calendarView);
  const [modalDate, setModalDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', priority: '', ordering: 'due_date' });
  const [error, setError] = useState('');
  const filteredTasks = useFilteredTasks(tasks, filters);
  const filteredCalendarTasks = useFilteredTasks(calendarTasks.length ? calendarTasks : tasks, filters);
  const overdueTaskIds = new Set(overdueTasks.filter((task) => !isDone(task, statuses)).map((task) => String(task.id)));
  const calendarTasksByDate = tasksByDate(filteredCalendarTasks.map((task) => ({
    ...task,
    overdue: overdueTaskIds.has(String(task.id)),
    categoryColor: categoryColor(task, categories),
  })));

  useEffect(() => {
    loadMetadata().catch((requestError) => setError(requestError.message));
  }, [loadMetadata]);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    loadTasks(params).catch((requestError) => setError(requestError.message));
  }, [filters, loadTasks]);

  useEffect(() => {
    loadCalendarTasks(calendarView, dateKey(days[0])).catch((requestError) => setError(requestError.message));
  }, [calendarView, days, loadCalendarTasks]);

  const openCreate = (date = todayKey()) => { setEditingTask(null); setModalDate(date); };
  const selectCalendarDate = (date) => {
    if (calendarView === 'month') {
      goToDate(date);
      setCalendarView('day');
      return;
    }
    openCreate(date);
  };
  const openEdit = (task) => { setEditingTask(task); setModalDate(task.due_date || todayKey()); };
  const closeModal = () => { setModalDate(null); setEditingTask(null); };

  async function moveTask(task, dueDate, dueTime) {
    if (task.due_date === dueDate && (task.due_time || '09:00').slice(0, 5) === dueTime) return;
    setError('');
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        due_date: dueDate,
        due_time: dueTime,
        priority: task.priority || 'medium',
        status_id: task.status_id ?? task.status?.id ?? task.status,
        category_id: task.category_id ?? task.category?.id ?? task.category ?? '',
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function advanceTaskStatus(task) {
    const currentId = task.status_id ?? task.status?.id ?? task.status;
    const currentIndex = statuses.findIndex((status) => String(status.id) === String(currentId));
    const nextStatus = statuses[currentIndex + 1];
    if (!nextStatus) return;

    setError('');
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        due_date: task.due_date,
        due_time: task.due_time || '09:00',
        priority: task.priority || 'medium',
        status_id: nextStatus.id,
        category_id: task.category_id ?? task.category?.id ?? task.category ?? '',
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveTask(payload) {
    setError('');
    if (editingTask) await updateTask(editingTask.id, payload);
    else await createTask(payload);
    closeModal();
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try { setError(''); await deleteTask(task.id); } catch (requestError) { setError(requestError.message); }
  }

  return <div className="planner-layout"><section className="calendar-area">
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <button className="round-button" aria-label="Previous week" onClick={() => shiftWeek(-1)}><UilAngleLeft size="20" /></button>
        <button className="round-button" aria-label="Next week" onClick={() => shiftWeek(1)}><UilAngleRight size="20" /></button>
        <h2><UilCalendarAlt size="19" />{formatMonthYear(week)}</h2>
      </div>
      <label>
        <span className="sr-only">Calendar view</span>
        <select className="calendar-view-select" value={calendarView} onChange={(event) => setCalendarView(event.target.value)}>
          <option value="hour">1 hour</option>
          <option value="4hours">4 hours</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </label>
      {calendarView === 'hour' && <label>
        <span className="sr-only">Select hour</span>
        <select className="calendar-view-select" value={selectedHour} onChange={(event) => setSelectedHour(Number(event.target.value))}>
          {Array.from({ length: 24 }, (_, hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00</option>)}
        </select>
      </label>}
      {calendarView === '4hours' && <label>
        <span className="sr-only">Select four-hour interval</span>
        <select className="calendar-view-select" value={selectedBlock} onChange={(event) => setSelectedBlock(Number(event.target.value))}>
          {Array.from({ length: 6 }, (_, block) => <option key={block} value={block}>{String(block * 4).padStart(2, '0')}:00 - {String((block + 1) * 4).padStart(2, '0')}:00</option>)}
        </select>
      </label>}
      <label className="calendar-date-picker">
        <span className="sr-only">Select date</span>
        <input type="date" value={dateKey(days[0])} onChange={(event) => { goToDate(event.target.value); setCalendarView(calendarView === 'month' ? 'day' : calendarView); }} />
      </label>
    </div>
    <CalendarGrid days={days} tasksByDate={calendarTasksByDate} onSelectDate={selectCalendarDate} onSelectTask={openEdit} onMoveTask={moveTask} onAdvanceTaskStatus={advanceTaskStatus} statuses={statuses} view={calendarView} selectedHour={selectedHour} selectedBlock={selectedBlock} />
  </section>
  <aside className="tasks-panel">
    <div className="panel-heading"><h3>Tasks</h3><span className="beta">Beta</span></div>
    <TaskFilters filters={filters} onChange={setFilters} statuses={statuses} categories={categories} priorities={priorities} />
    <div className="task-section">
      <div className="section-title"><span>Upcoming</span><b>{filteredTasks.length}</b></div>
      {loading && <p className="muted">Loading tasks…</p>}
      {!loading && filteredTasks.length === 0 && <p className="muted">No tasks match the selected filters.</p>}
      {filteredTasks.slice(0, 12).map((task) => {
        const overdue = overdueTaskIds.has(String(task.id));
        return <div className={`task-row${overdue ? ' overdue' : ''}`} key={task.id}>
        <span className={`task-dot priority-${task.priority || 'medium'}`} />
        <div className="task-row-content">
          <strong>{task.title}</strong>
          <small>{task.due_date || 'No due date'} {task.due_time ? `· ${task.due_time.slice(0, 5)}` : ''}</small>
          <small>{statusName(task, statuses)} · {categoryName(task, categories)}</small>
        </div>
        <div className="task-actions">
          {statuses.findIndex((status) => String(status.id) === String(task.status_id ?? task.status?.id ?? task.status)) < statuses.length - 1 && <button aria-label={`Move ${task.title} to next status`} title="Next status" onClick={() => advanceTaskStatus(task)}><UilArrowRight size="16" /></button>}
          <button aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}><UilEditAlt size="16" /></button>
          <button aria-label={`Delete ${task.title}`} onClick={() => removeTask(task)}><UilTrashAlt size="16" /></button>
        </div>
      </div>;
      })}
    </div>
    {error && <p className="form-error">{error}</p>}
    <button className="add-task-button" onClick={() => openCreate()}><UilPlus size="17" /> Add task</button>
  </aside>
  {modalDate && <TaskForm date={modalDate} task={editingTask} statuses={statuses} categories={categories} onClose={closeModal} onSubmit={saveTask} />}
  </div>;
}
