import { useEffect, useMemo, useState } from 'react';
import {
  taskBelongsToBoard,
  statusBelongsToBoard,
  categoryBelongsToBoard,
} from '../../utils/boardScope';

export function useKanbanData({
  tasks,
  statuses,
  categories,
  boards,
  activeBoard,
  loadTasks,
  loadMetadata,
}) {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
    ordering: 'position',
  });
  const [error, setError] = useState('');

  // Initial load of metadata
  useEffect(() => {
    loadMetadata().catch((requestError) => setError(requestError.message));
  }, [loadMetadata]);

  // Load tasks when activeBoard or filters change
  useEffect(() => {
    if (activeBoard) {
      loadTasks(filters).catch((requestError) => setError(requestError.message));
    }
  }, [activeBoard, filters, loadTasks]);

  const defaultBoardId = boards[0]?.id;
  const currentBoardId = activeBoard?.id || defaultBoardId;

  // 1. Board-scoped tasks: strictly filtered for currentBoardId
  const boardTasks = useMemo(() => {
    return tasks.filter((task) => taskBelongsToBoard(task, currentBoardId, defaultBoardId));
  }, [tasks, currentBoardId, defaultBoardId]);

  // 2. Board-scoped statuses: strictly filtered for currentBoardId, never pulling from other boards
  const boardStatuses = useMemo(() => {
    return statuses.filter((status) => statusBelongsToBoard(status, currentBoardId, defaultBoardId));
  }, [statuses, currentBoardId, defaultBoardId]);

  // 3. Board-scoped categories: strictly filtered for currentBoardId, never pulling from other boards
  const boardCategories = useMemo(() => {
    return categories.filter((category) => categoryBelongsToBoard(category, currentBoardId, defaultBoardId));
  }, [categories, currentBoardId, defaultBoardId]);

  // 4. Tasks filtered by user search, status, category, priority, ordering
  const filteredTasks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return [...boardTasks]
      .filter(
        (task) =>
          !search ||
          task.title?.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search)
      )
      .filter((task) => {
        if (!filters.status) return true;
        const currentStatusId = task.status_id ?? task.status?.id ?? task.status;
        return String(currentStatusId) === filters.status;
      })
      .filter((task) => {
        if (!filters.category) return true;
        const currentCategoryId = task.category_id ?? task.category?.id ?? task.category;
        return String(currentCategoryId) === filters.category;
      })
      .filter((task) => !filters.priority || task.priority === filters.priority)
      .sort((first, second) => {
        if (filters.ordering === 'due_date') {
          return `${first.due_date || ''}T${first.due_time || ''}`.localeCompare(
            `${second.due_date || ''}T${second.due_time || ''}`
          );
        }
        if (filters.ordering === '-created_at') {
          return String(second.created_at || '').localeCompare(String(first.created_at || ''));
        }
        return 0;
      });
  }, [boardTasks, filters]);

  const updateFilter = (field) => (event) => {
    setFilters((current) => ({ ...current, [field]: event.target.value }));
  };

  return {
    filters,
    updateFilter,
    boardTasks,
    boardStatuses,
    boardCategories,
    filteredTasks,
    error,
    setError,
  };
}
