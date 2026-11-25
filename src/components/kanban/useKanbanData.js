import { useEffect, useMemo, useState } from 'react';
import {
  taskBelongsToBoard,
  statusBelongsToBoard,
  categoryBelongsToBoard,
} from '../../utils/boardScope';
import { priorityName } from '../../utils/priority';

const EMPTY_FILTERS = { status: [], category: [], priority: [], assignee: [], due: [] };
const PRIORITY_RANK = { low: 0, medium: 1, high: 2, critical: 3 };

const asList = (value) => (Array.isArray(value) ? value : value ? [String(value)] : []);

/** Today / this week / next week / no date — the buckets of the filter panel. */
const dueBucket = (dueDate) => {
  if (!dueDate) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'none';
  const diff = Math.round((date - today) / 86400000);
  if (diff === 0) return 'today';
  if (diff > 0 && diff <= 6) return 'week';
  if (diff >= 7 && diff <= 13) return 'next_week';
  return '';
};

const compareTasks = (first, second, ordering) => {
  const direction = ordering.startsWith('-') ? -1 : 1;
  const field = ordering.replace(/^-/, '');

  if (field === 'due_date') {
    const keyA = first.due_date ? `${first.due_date}T${first.due_time || '00:00'}` : '';
    const keyB = second.due_date ? `${second.due_date}T${second.due_time || '00:00'}` : '';
    if (!keyA && !keyB) return 0;
    if (!keyA) return 1;
    if (!keyB) return -1;
    return keyA.localeCompare(keyB) * direction;
  }

  if (field === 'priority') {
    return ((PRIORITY_RANK[priorityName(first.priority)] ?? 1) - (PRIORITY_RANK[priorityName(second.priority)] ?? 1)) * direction;
  }

  if (field === 'created_at') {
    const keyA = String(first.created_at || '');
    const keyB = String(second.created_at || '');
    if (!keyA && !keyB) return 0;
    if (!keyA) return 1;
    if (!keyB) return -1;
    return keyA.localeCompare(keyB) * direction;
  }

  if (field === 'title') {
    return String(first.title || '').localeCompare(String(second.title || '')) * direction;
  }

  return 0;
};

export function useKanbanData({
  tasks,
  statuses,
  categories,
  boards,
  activeBoard,
  loadTasks,
  loadMetadata,
}) {
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ordering: 'position' });
  const [error, setError] = useState('');

  // Initial load of metadata
  useEffect(() => {
    loadMetadata().catch((requestError) => setError(requestError.message));
  }, [loadMetadata]);

  // Tasks are fetched per board; filtering and sorting happen locally so the panels can
  // offer the values the tasks really contain.
  useEffect(() => {
    if (activeBoard?.id) {
      loadTasks().catch((requestError) => setError(requestError.message));
    }
  }, [activeBoard, loadTasks]);

  const defaultBoardId = boards[0]?.id;
  const currentBoardId = activeBoard?.id || defaultBoardId;

  // 1. Board-scoped tasks: strictly filtered for currentBoardId
  const boardTasks = useMemo(() => {
    if (!currentBoardId) return [];
    return tasks.filter((task) => taskBelongsToBoard(task, currentBoardId, defaultBoardId));
  }, [tasks, currentBoardId, defaultBoardId]);

  // 2. Board-scoped statuses: strictly filtered for currentBoardId, never pulling from other boards
  const boardStatuses = useMemo(() => {
    if (!currentBoardId) return [];
    return statuses.filter((status) => statusBelongsToBoard(status, currentBoardId, defaultBoardId));
  }, [statuses, currentBoardId, defaultBoardId]);

  // 3. Board-scoped categories: strictly filtered for currentBoardId, never pulling from other boards
  const boardCategories = useMemo(() => {
    if (!currentBoardId) return [];
    return categories.filter((category) => categoryBelongsToBoard(category, currentBoardId, defaultBoardId));
  }, [categories, currentBoardId, defaultBoardId]);

  // 4. Tasks filtered and sorted by the board toolbar
  const filteredTasks = useMemo(() => {
    const selectedStatuses = asList(filters.status);
    const selectedCategories = asList(filters.category);
    const selectedPriorities = asList(filters.priority);
    const selectedAssignees = asList(filters.assignee);
    const selectedDue = asList(filters.due);

    return [...boardTasks]
      .filter((task) => {
        if (!selectedStatuses.length) return true;
        const statusId = task.status_id ?? task.status?.id ?? task.status;
        return selectedStatuses.includes(String(statusId));
      })
      .filter((task) => {
        if (!selectedCategories.length) return true;
        const categoryId = task.category_id ?? task.category?.id ?? task.category;
        return selectedCategories.includes(String(categoryId));
      })
      .filter((task) => {
        if (!selectedPriorities.length) return true;
        return selectedPriorities.includes(priorityName(task.priority));
      })
      .filter((task) => {
        if (!selectedAssignees.length) return true;
        const assigneeId = task.assignee_id ?? task.assignee?.id ?? task.assignee;
        const key = assigneeId === null || assigneeId === undefined || assigneeId === '' ? 'unassigned' : String(assigneeId);
        return selectedAssignees.includes(key);
      })
      .filter((task) => {
        if (!selectedDue.length) return true;
        return selectedDue.includes(dueBucket(task.due_date));
      })
      .sort((first, second) => compareTasks(first, second, filters.ordering || 'position'));
  }, [boardTasks, filters]);

  const applyFilters = (next) => {
    setFilters((current) => ({
      ...current,
      ...EMPTY_FILTERS,
      ...next,
      ordering: current.ordering,
    }));
  };

  const resetFilters = () => {
    setFilters((current) => ({ ...current, ...EMPTY_FILTERS }));
  };

  const setOrdering = (ordering) => {
    setFilters((current) => ({ ...current, ordering }));
  };

  return {
    filters,
    applyFilters,
    resetFilters,
    setOrdering,
    boardTasks,
    boardStatuses,
    boardCategories,
    filteredTasks,
    error,
    setError,
  };
}
