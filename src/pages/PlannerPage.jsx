import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UilAngleLeft, UilAngleRight, UilCalendarAlt, UilEditAlt, UilTrashAlt, UilPlus, UilArrowRight, UilSearch, UilBars, UilFileAlt, UilUser } from '@iconscout/react-unicons';
import CalendarGrid from '../components/calendar/CalendarGrid';
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
  return ['done', 'completed'].includes(status.trim().toLowerCase());
};
export default function PlannerPage() {
  const {
    tasks, overdueTasks, calendarTasks, statuses, categories, priorities, loading, loadTasks, loadCalendarTasks, loadMetadata,
    createTask, updateTask, setTaskStatus, deleteTask,
  } = useTaskContext();
  const [searchParams] = useSearchParams();
  const showCalendar = searchParams.get('view') === 'calendar';
  const [calendarView, setCalendarView] = useState('week');
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedBlock, setSelectedBlock] = useState(Math.floor(new Date().getHours() / 4));
  const { week, days, shiftWeek, goToDate, todayKey } = useCalendar(calendarView);
  const [modalDate, setModalDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [metadataMenu, setMetadataMenu] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', priority: '', ordering: 'due_date' });
  const [error, setError] = useState('');
  const filteredTasks = useFilteredTasks(tasks, filters);
  const filteredCalendarTasks = useFilteredTasks(calendarTasks, filters);
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
    loadCalendarTasks(calendarView, dateKey(week)).catch((requestError) => setError(requestError.message));
  }, [calendarView, week, loadCalendarTasks]);

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
      await setTaskStatus(task.id, nextStatus.name);
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

  const columns = statuses.length ? statuses : [
    { id: 'inbox', name: 'Inbox' }, { id: 'planned', name: 'Planned' }, { id: 'progress', name: 'In progress' },
    { id: 'approval', name: 'Needs approval' }, { id: 'done', name: 'Done' },
  ];
  const tasksForColumn = (status) => filteredTasks.filter((task) => String(task.status_id ?? task.status?.id ?? task.status) === String(status.id) || statusName(task, statuses).toLowerCase() === status.name.toLowerCase());

  if (showCalendar) return <div className="planner-layout calendar-layout"><section className="calendar-area">
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
        <input type="date" value={dateKey(week)} onChange={(event) => { goToDate(event.target.value); setCalendarView(calendarView === 'month' ? 'day' : calendarView); }} />
      </label>
    </div>
    <CalendarGrid days={days} tasksByDate={calendarTasksByDate} onSelectDate={selectCalendarDate} onSelectTask={openEdit} onMoveTask={moveTask} onAdvanceTaskStatus={advanceTaskStatus} statuses={statuses} view={calendarView} selectedHour={selectedHour} selectedBlock={selectedBlock} />
  </section>{modalDate && <TaskForm date={modalDate} task={editingTask} statuses={statuses} categories={categories} onClose={closeModal} onSubmit={saveTask} />}</div>;

  return <div className="workspace-page">
    <section className="board-heading">
      <div><h1>My task board</h1><p>A clearer day starts here. Plan it, delegate it, get it done.</p></div>
      <div className="board-heading-actions">
        <span className="collaborators" aria-label="User account"><UilUser size="14" /></span>
        <div className="metadata-menu">
          <button className="metadata-button" onClick={() => setMetadataMenu(metadataMenu === 'statuses' ? null : 'statuses')}>Statuses <UilPlus size="14" /></button>
          {metadataMenu === 'statuses' && <div className="metadata-list"><strong>Statuses</strong>{statuses.length ? statuses.map((status) => <span key={status.id}>{status.name}</span>) : <span>No statuses</span>}</div>}
        </div>
        <div className="metadata-menu">
          <button className="metadata-button" onClick={() => setMetadataMenu(metadataMenu === 'categories' ? null : 'categories')}>Categories <UilPlus size="14" /></button>
          {metadataMenu === 'categories' && <div className="metadata-list"><strong>Categories</strong>{categories.length ? categories.map((category) => <span key={category.id}>{category.name}</span>) : <span>No categories</span>}</div>}
        </div>
        <button className="new-task-button" onClick={() => openCreate()}><UilPlus size="16" /> New task</button>
      </div>
    </section>
    <div className="board-tabs"><button className="selected"><UilBars size="16" />Board</button><button><UilFileAlt size="16" />List</button><a href="/planner?view=calendar"><UilCalendarAlt size="16" />Calendar</a><div className="board-tools"><label className="board-search"><UilSearch size="15" /><input className="board-control" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search tasks" /></label><select className="board-control" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} aria-label="Filter by status"><option value="">All statuses</option>{statuses.map((status) => <option value={status.id} key={status.id}>{status.name}</option>)}</select><select className="board-control" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} aria-label="Filter by category"><option value="">All categories</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><select className="board-control" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} aria-label="Filter by priority"><option value="">All priorities</option>{priorities.map((priority) => <option value={priority} key={priority}>{priority}</option>)}</select><select className="board-control" value={filters.ordering} onChange={(event) => setFilters((current) => ({ ...current, ordering: event.target.value }))} aria-label="Sort tasks"><option value="due_date">Due date</option><option value="-created_at">Newest</option><option value="priority">Priority</option></select></div></div>
    {error && <p className="form-error">{error}</p>}
    <div className="board-columns">
      {columns.map((status) => <section className="board-column" key={status.id}>
        <div className="column-heading"><span className="status-dot" /> <strong>{status.name}</strong><b>{tasksForColumn(status).length}</b><button>•••</button><button onClick={() => openCreate()}>+</button></div>
        <div className="column-cards">
          {loading && <p className="muted">Loading tasks...</p>}
          {!loading && tasksForColumn(status).map((task) => <article className={`board-card${overdueTaskIds.has(String(task.id)) ? ' overdue' : ''}`} key={task.id}>
            <div className="card-topline"><span>{categoryName(task, categories)}</span><button onClick={() => openEdit(task)}>•••</button></div>
            <h3>{task.title}</h3><p>{task.description || 'No description added yet.'}</p>
            <div className="card-meta"><span>▣ {task.due_date || 'No due date'}</span><span>☷ {task.priority || 'Medium'}</span><span className="mini-avatar">AL</span></div>
            <div className="card-actions"><button onClick={() => openEdit(task)}><UilEditAlt size="13" /> Edit</button><button onClick={() => removeTask(task)}><UilTrashAlt size="13" /></button>{statuses.findIndex((item) => String(item.id) === String(task.status_id ?? task.status?.id ?? task.status)) < statuses.length - 1 && <button onClick={() => advanceTaskStatus(task)}><UilArrowRight size="13" /></button>}</div>
          </article>)}
          <button className="column-add" onClick={() => openCreate()}>+ Add task</button>
        </div>
      </section>)}
    </div>
    {modalDate && <TaskForm date={modalDate} task={editingTask} statuses={statuses} categories={categories} onClose={closeModal} onSubmit={saveTask} />}
  </div>;
}
