import { useEffect, useMemo, useState } from 'react';
import CalendarGrid from '../components/calendar/CalendarGrid';
import { useTaskContext } from '../context/TaskContext';
import { dateKey, startOfWeek } from '../utils/dateUtils';
import TaskForm from '../components/tasks/TaskForm';

export default function PlannerPage() {
  const { tasks, loading, loadTasks, createTask } = useTaskContext();
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [modalDate, setModalDate] = useState(null);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const day = new Date(week); day.setDate(week.getDate() + index); return day; }), [week]);
  useEffect(() => { loadTasks().catch(() => undefined); }, [loadTasks]);
  const tasksByDate = tasks.reduce((result, task) => { if (task.due_date) result[task.due_date] = [...(result[task.due_date] || []), task]; return result; }, {});
  const shiftWeek = (amount) => setWeek((current) => { const next = new Date(current); next.setDate(next.getDate() + amount * 7); return next; });

  return <div className="planner-layout"><section className="calendar-area"><div className="calendar-toolbar"><div className="toolbar-left"><button className="round-button" onClick={() => shiftWeek(-1)}>‹</button><button className="round-button" onClick={() => shiftWeek(1)}>›</button><h2>{week.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div><button className="today-button" onClick={() => setWeek(startOfWeek(new Date()))}>Today</button></div><CalendarGrid days={days} tasksByDate={tasksByDate} onSelectDate={setModalDate} /></section><aside className="tasks-panel"><div className="panel-heading"><h3>Tasks</h3><span className="beta">Beta</span></div><div className="search-box">⌕ <input placeholder="Search tasks…" /></div><div className="task-section"><div className="section-title"><span>Upcoming</span><b>{tasks.length}</b></div>{loading && <p className="muted">Loading tasks…</p>}{!loading && tasks.length === 0 && <p className="muted">No tasks yet. Click a calendar day to add one.</p>}{tasks.slice(0, 8).map((task) => <div className="task-row" key={task.id}><span className={`task-dot ${task.priority || 'medium'}`} /><div><strong>{task.title}</strong><small>{task.due_date || 'No due date'}</small></div></div>)}</div><button className="add-task-button" onClick={() => setModalDate(dateKey(new Date()))}>＋ Add task</button></aside>{modalDate && <TaskForm date={modalDate} onClose={() => setModalDate(null)} onSubmit={async (payload) => { await createTask(payload); setModalDate(null); }} />}</div>;
}
