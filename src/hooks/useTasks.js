import { useMemo } from 'react';

export function useFilteredTasks(tasks, filters) {
  return useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return [...tasks]
      .filter((task) => !search || task.title?.toLowerCase().includes(search) || task.description?.toLowerCase().includes(search))
      .filter((task) => !filters.status || String(task.status_id ?? task.status?.id ?? task.status ?? '') === filters.status)
      .filter((task) => !filters.category || String(task.category_id ?? task.category?.id ?? task.category ?? '') === filters.category)
      .filter((task) => !filters.priority || task.priority === filters.priority)
      .sort((first, second) => {
        if (filters.ordering === 'priority') return ['high', 'medium', 'low'].indexOf(first.priority) - ['high', 'medium', 'low'].indexOf(second.priority);
        if (filters.ordering === 'created_at') return String(first.created_at || '').localeCompare(String(second.created_at || ''));
        if (filters.ordering === '-created_at') return String(second.created_at || '').localeCompare(String(first.created_at || ''));
        return `${first.due_date || ''}T${first.due_time || ''}`.localeCompare(`${second.due_date || ''}T${second.due_time || ''}`);
      });
  }, [filters, tasks]);
}

export function tasksByDate(tasks) {
  return tasks.reduce((result, task) => {
    if (task.due_date) result[task.due_date] = [...(result[task.due_date] || []), task];
    return result;
  }, {});
}