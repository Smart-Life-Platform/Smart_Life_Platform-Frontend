import { createContext, useCallback, useContext, useState } from 'react';
import { getTasks, createTask as createTaskRequest } from '../api/tasksApi';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(Array.isArray(data) ? data : data?.results || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (payload) => {
    const task = await createTaskRequest(payload);
    setTasks((current) => [...current, task]);
    return task;
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, loading, loadTasks, createTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used inside TaskProvider');
  return context;
}
