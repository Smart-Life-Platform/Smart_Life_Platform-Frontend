import { useEffect, useMemo, useState } from 'react';
import { UilAngleLeft, UilAngleRight, UilCalendarAlt, UilEditAlt, UilSearch, UilTrashAlt, UilPlus } from '@iconscout/react-unicons';
import CalendarGrid from '../components/calendar/CalendarGrid';
import { useTaskContext } from '../context/TaskContext';
import { dateKey, startOfWeek } from '../utils/dateUtils';
import TaskForm from '../components/tasks/TaskForm';

const statusName = (task, statuses) => statuses.find((item) => item.id === (task.status_id || task.status?.id))?.name || task.status?.name || 'To Do';
const categoryName = (task, categories) => categories.find((item) => item.id === (task.category_id || task.category?.id))?.name || task.category?.name || 'No category';

export default function PlannerPage() {
  const { tasks, statuses, categories, loading, loadTasks, loadMetadata, createTask, updateTask, deleteTask } = useTaskContext();
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [modalDate, setModalDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', sort: 'due_date' });
  const [error, setError] = useState('');
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const day = new Date(week); day.setDate(week.getDate() + index); return day; }), [week]);

  useEffect(() => { Promise.all([loadTasks(), loadMetadata()]).catch((requestError) => setError(requestError.message)); }, [loadTasks, loadMetadata]);

  const filteredTasks = [...tasks]
    .filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
    .filter((task) => !filters.status || String(task.status_id || task.status?.id) === filters.status)
    .filter((task) => !filters.category || String(task.category_id || task.category?.id) === filters.category)
    .filter((task) => !filters.priority || task.priority === filters.priority)
    .sort((a, b) => {
      if (filters.sort === 'priority') return ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority);
      if (filters.sort === 'status') return (a.status_id || a.status?.id || 1) - (b.status_id || b.status?.id || 1);
      if (filters.sort === 'category') return categoryName(a, categories).localeCompare(categoryName(b, categories));
      return `${a.due_date || ''}T${a.due_time || ''}`.localeCompare(`${b.due_date || ''}T${b.due_time || ''}`);
    });
  const tasksByDate = filteredTasks.reduce((result, task) => { if (task.due_date) result[task.due_date] = [...(result[task.due_date] || []), task]; return result; }, {});
  const shiftWeek = (amount) => setWeek((current) => { const next = new Date(current); next.setDate(next.getDate() + amount * 7); return next; });
  const openCreate = (date = dateKey(new Date())) => { setEditingTask(null); setModalDate(date); };
  const openEdit = (task) => { setEditingTask(task); setModalDate(task.due_date || dateKey(new Date())); };
  const closeModal = () => { setModalDate(null); setEditingTask(null); };

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

  return <div className="planner-layout"><section className="calendar-area"><div className="calendar-toolbar"><div className="toolbar-left"><button className="round-button" aria-label="Previous week" onClick={() => shiftWeek(-1)}><UilAngleLeft size="20" /></button><button className="round-button" aria-label="Next week" onClick={() => shiftWeek(1)}><UilAngleRight size="20" /></button><h2><UilCalendarAlt size="19" />{week.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div><button className="today-button" onClick={() => setWeek(startOfWeek(new Date()))}>Today</button></div><CalendarGrid days={days} tasksByDate={tasksByDate} onSelectDate={openCreate} onSelectTask={openEdit} /></section><aside className="tasks-panel"><div className="panel-heading"><h3>Tasks</h3><span className="beta">Beta</span></div><div className="search-box"><UilSearch size="18" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" /></div><div className="filter-grid"><select aria-label="Filter status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select><select aria-label="Filter category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><select aria-label="Filter priority" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select aria-label="Sort tasks" value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="due_date">Sort by date</option><option value="status">Sort by status</option><option value="category">Sort by category</option><option value="priority">Sort by priority</option></select></div><div className="task-section"><div className="section-title"><span>Upcoming</span><b>{filteredTasks.length}</b></div>{loading && <p className="muted">Loading tasks…</p>}{!loading && filteredTasks.length === 0 && <p className="muted">No tasks match the selected filters.</p>}{filteredTasks.slice(0, 12).map((task) => <div className="task-row" key={task.id}><span className={`task-dot priority-${task.priority || 'medium'}`} /><div className="task-row-content"><strong>{task.title}</strong><small>{task.due_date || 'No due date'} {task.due_time ? `· ${task.due_time.slice(0, 5)}` : ''}</small><small>{statusName(task, statuses)} · {categoryName(task, categories)}</small></div><div className="task-actions"><button aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}><UilEditAlt size="16" /></button><button aria-label={`Delete ${task.title}`} onClick={() => removeTask(task)}><UilTrashAlt size="16" /></button></div></div>)}</div>{error && <p className="form-error">{error}</p>}<button className="add-task-button" onClick={() => openCreate()}><UilPlus size="17" /> Add task</button></aside>{modalDate && <TaskForm date={modalDate} task={editingTask} statuses={statuses} categories={categories} onClose={closeModal} onSubmit={saveTask} />}</div>;
}
