import { useEffect, useState } from 'react';
import { UilAngleLeft, UilAngleRight, UilCalendarAlt, UilEditAlt, UilTrashAlt, UilPlus } from '@iconscout/react-unicons';
import CalendarGrid from '../components/calendar/CalendarGrid';
import TaskFilters from '../components/tasks/TaskFilters';
import { useTaskContext } from '../context/TaskContext';
import { formatMonthYear } from '../utils/dateUtils';
import useCalendar from '../hooks/useCalendar';
import { tasksByDate, useFilteredTasks } from '../hooks/useTasks';
import TaskForm from '../components/tasks/TaskForm';

const statusName = (task, statuses) => task.status_name || statuses.find((item) => String(item.id) === String(task.status_id ?? task.status?.id ?? task.status))?.name || task.status?.name || 'Unknown status';
const categoryName = (task, categories) => task.category_name || categories.find((item) => String(item.id) === String(task.category_id ?? task.category?.id ?? task.category))?.name || task.category?.name || 'No category';
export default function PlannerPage() {
  const {
    tasks, statuses, categories, priorities, loading, loadTasks, loadMetadata,
    createTask, updateTask, deleteTask,
  } = useTaskContext();
  const { week, days, shiftWeek, resetToToday, todayKey } = useCalendar();
  const [modalDate, setModalDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', category: '', priority: '', ordering: 'due_date' });
  const [error, setError] = useState('');
  const filteredTasks = useFilteredTasks(tasks, filters);
  const visibleTasksByDate = tasksByDate(filteredTasks);

  useEffect(() => {
    loadMetadata().catch((requestError) => setError(requestError.message));
  }, [loadMetadata]);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
    loadTasks(params).catch((requestError) => setError(requestError.message));
  }, [filters, loadTasks]);

  const openCreate = (date = todayKey()) => { setEditingTask(null); setModalDate(date); };
  const openEdit = (task) => { setEditingTask(task); setModalDate(task.due_date || todayKey()); };
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

  return <div className="planner-layout"><section className="calendar-area">
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <button className="round-button" aria-label="Previous week" onClick={() => shiftWeek(-1)}><UilAngleLeft size="20" /></button>
        <button className="round-button" aria-label="Next week" onClick={() => shiftWeek(1)}><UilAngleRight size="20" /></button>
        <h2><UilCalendarAlt size="19" />{formatMonthYear(week)}</h2>
      </div>
      <button className="today-button" onClick={resetToToday}>Today</button>
    </div>
    <CalendarGrid days={days} tasksByDate={visibleTasksByDate} onSelectDate={openCreate} onSelectTask={openEdit} />
  </section>
  <aside className="tasks-panel">
    <div className="panel-heading"><h3>Tasks</h3><span className="beta">Beta</span></div>
    <TaskFilters filters={filters} onChange={setFilters} statuses={statuses} categories={categories} priorities={priorities} />
    <div className="task-section">
      <div className="section-title"><span>Upcoming</span><b>{filteredTasks.length}</b></div>
      {loading && <p className="muted">Loading tasks…</p>}
      {!loading && filteredTasks.length === 0 && <p className="muted">No tasks match the selected filters.</p>}
      {filteredTasks.slice(0, 12).map((task) => <div className="task-row" key={task.id}>
        <span className={`task-dot priority-${task.priority || 'medium'}`} />
        <div className="task-row-content">
          <strong>{task.title}</strong>
          <small>{task.due_date || 'No due date'} {task.due_time ? `· ${task.due_time.slice(0, 5)}` : ''}</small>
          <small>{statusName(task, statuses)} · {categoryName(task, categories)}</small>
        </div>
        <div className="task-actions">
          <button aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}><UilEditAlt size="16" /></button>
          <button aria-label={`Delete ${task.title}`} onClick={() => removeTask(task)}><UilTrashAlt size="16" /></button>
        </div>
      </div>)}
    </div>
    {error && <p className="form-error">{error}</p>}
    <button className="add-task-button" onClick={() => openCreate()}><UilPlus size="17" /> Add task</button>
  </aside>
  {modalDate && <TaskForm date={modalDate} task={editingTask} statuses={statuses} categories={categories} onClose={closeModal} onSubmit={saveTask} />}
  </div>;
}
