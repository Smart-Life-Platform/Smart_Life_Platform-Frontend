import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { deleteTask as deleteTaskRequest, getOverdueTasks, getTasks, getTasksByDay, getTasksByMonth, getTasksByWeek, createTask as createTaskRequest, updateTask as updateTaskRequest } from '../api/tasksApi';
import { getCategories } from '../api/categoriesApi';
import { getStatuses } from '../api/statusesApi';
import { getPriorities } from '../api/prioritiesApi';

const TaskContext = createContext(null);

function taskList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || data?.tasks || data?.overdue_tasks || [];
}

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const taskRequestId = useRef(0);
  const calendarRequestId = useRef(0);

  const loadTasks = useCallback(async (params) => {
    const requestId = ++taskRequestId.current;
    setLoading(true);
    try {
      const data = await getTasks(params);
      if (requestId !== taskRequestId.current) return;
      setTasks(taskList(data));

      try {
        const overdueData = await getOverdueTasks();
        if (requestId === taskRequestId.current) setOverdueTasks(taskList(overdueData));
      } catch (overdueError) {
        console.error('Unable to load overdue tasks:', overdueError);
        if (requestId === taskRequestId.current) setOverdueTasks([]);
      }
    } finally {
      if (requestId === taskRequestId.current) setLoading(false);
    }
  }, []);

  const loadCalendarTasks = useCallback(async (view, date) => {
    const requestId = ++calendarRequestId.current;
    setCalendarTasks([]);
    const params = { date };
    const request = view === 'month' ? getTasksByMonth : view === 'week' ? getTasksByWeek : getTasksByDay;
    const data = await request(params);
    if (requestId === calendarRequestId.current) setCalendarTasks(taskList(data));
  }, []);

  const loadMetadata = useCallback(async () => {
    const [statusData, categoryData, priorityData] = await Promise.all([getStatuses(), getCategories(), getPriorities()]);
    setStatuses(Array.isArray(statusData) ? statusData : statusData?.results || []);
    setCategories(Array.isArray(categoryData) ? categoryData : categoryData?.results || []);
    const availablePriorities = Array.isArray(priorityData) ? priorityData : priorityData?.results || [];
    setPriorities(availablePriorities.map((priority, index) => {
      if (typeof priority === 'string') return priority;
      return ['low', 'medium', 'high'][index] || String(priority);
    }));
  }, []);

  const createTask = useCallback(async (payload) => {
    const task = await createTaskRequest(payload);
    setTasks((current) => [...current, task]);
    setCalendarTasks((current) => [...current, task]);
    getOverdueTasks().then((data) => setOverdueTasks(taskList(data))).catch((error) => {
      console.error('Unable to refresh overdue tasks:', error);
    });
    return task;
  }, []);

  const updateTask = useCallback(async (id, payload) => {
    const task = await updateTaskRequest(id, payload);
    setTasks((current) => current.map((item) => (item.id === id ? { ...item, ...task } : item)));
    setCalendarTasks((current) => current.map((item) => (item.id === id ? { ...item, ...task } : item)));
    getOverdueTasks().then((data) => setOverdueTasks(taskList(data))).catch((error) => {
      console.error('Unable to refresh overdue tasks:', error);
    });
    return task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await deleteTaskRequest(id);
    setTasks((current) => current.filter((item) => item.id !== id));
    setCalendarTasks((current) => current.filter((item) => item.id !== id));
    getOverdueTasks().then((data) => setOverdueTasks(taskList(data))).catch((error) => {
      console.error('Unable to refresh overdue tasks:', error);
    });
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, overdueTasks, calendarTasks, statuses, categories, priorities, loading, loadTasks, loadCalendarTasks, loadMetadata, createTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used inside TaskProvider');
  return context;
}
