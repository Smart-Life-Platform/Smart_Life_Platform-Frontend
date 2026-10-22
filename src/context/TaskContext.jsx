import { createContext, useCallback, useContext, useState } from 'react';
import { deleteTask as deleteTaskRequest, getTasks, createTask as createTaskRequest, updateTask as updateTaskRequest } from '../api/tasksApi';
import { getCategories } from '../api/categoriesApi';
import { getStatuses } from '../api/statusesApi';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : data?.results || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMetadata = useCallback(async () => {
    const [statusData, categoryData] = await Promise.all([getStatuses(), getCategories()]);
    setStatuses(Array.isArray(statusData) ? statusData : statusData?.results || []);
    setCategories(Array.isArray(categoryData) ? categoryData : categoryData?.results || []);
  }, []);

  const createTask = useCallback(async (payload) => {
    const task = await createTaskRequest(payload);
    setTasks((current) => [...current, task]);
    return task;
  }, []);

  const updateTask = useCallback(async (id, payload) => {
    const task = await updateTaskRequest(id, payload);
    setTasks((current) => current.map((item) => (item.id === id ? task : item)));
    return task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await deleteTaskRequest(id);
    setTasks((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, statuses, categories, loading, loadTasks, loadMetadata, createTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used inside TaskProvider');
  return context;
}
