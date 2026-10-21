import { useEffect, useMemo, useState } from 'react';
import { UilAngleLeft, UilAngleRight, UilCalendarAlt, UilEditAlt, UilSearch, UilTrashAlt, UilPlus } from '@iconscout/react-unicons';
import CalendarGrid from '../components/calendar/CalendarGrid';
import { useTaskContext } from '../context/TaskContext';
import { dateKey, startOfWeek } from '../utils/dateUtils';
import TaskForm from '../components/tasks/TaskForm';

export default function PlannerPage() {
  const { tasks, loading, loadTasks, createTask, updateTask, deleteTask } = useTaskContext();
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [modalDate, setModalDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const day = new Date(week); day.setDate(week.getDate() + index); return day; }), [week]);

  useEffect(() => { loadTasks().catch((requestError) => setError(requestError.message)); }, [loadTasks]);

  const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()));
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

  return <div className="planner-layout"><section className="calendar-area"><div className="calendar-toolbar"><div className="toolbar-left"><button className="round-button" aria-label="Previous week" onClick={() => shiftWeek(-1)}><UilAngleLeft size="20" /></button><button className="round-button" aria-label="Next week" onClick={() => shiftWeek(1)}><UilAngleRight size="20" /></button><h2><UilCalendarAlt size="19" />{week.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div><button className="today-button" onClick={() => setWeek(startOfWeek(new Date()))}>Today</button></div><CalendarGrid days={days} tasksByDate={tasksByDate} onSelectDate={openCreate} onSelectTask={openEdit} /></section><aside className="tasks-panel"><div className="panel-heading"><h3>Tasks</h3><span className="beta">Beta</span></div><div className="search-box"><UilSearch size="18" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" /></div><div className="task-section"><div className="section-title"><span>Upcoming</span><b>{filteredTasks.length}</b></div>{loading && <p className="muted">Loading tasks…</p>}{!loading && filteredTasks.length === 0 && <p className="muted">No tasks yet. Click a calendar day to add one.</p>}{filteredTasks.slice(0, 8).map((task) => <div className="task-row" key={task.id}><span className={`task-dot ${task.priority || 'medium'}`} /><div className="task-row-content"><strong>{task.title}</strong><small>{task.due_date || 'No due date'}</small></div><div className="task-actions"><button aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}><UilEditAlt size="16" /></button><button aria-label={`Delete ${task.title}`} onClick={() => removeTask(task)}><UilTrashAlt size="16" /></button></div></div>)}</div>{error && <p className="form-error">{error}</p>}<button className="add-task-button" onClick={() => openCreate()}><UilPlus size="17" /> Add task</button></aside>{modalDate && <TaskForm date={modalDate} task={editingTask} onClose={closeModal} onSubmit={saveTask} />}</div>;
}
