import { renderHook } from '@testing-library/react';
import { tasksByDate, useFilteredTasks } from '../hooks/useTasks';

const filters = { search: '', status: '', category: '', priority: '', ordering: 'priority' };

test('sorts all supported priorities and puts unknown values last without mutating tasks', () => {
  const tasks = [
    { id: 1, priority: 'unknown' }, { id: 2, priority: 'low' },
    { id: 3, priority: 'critical' }, { id: 4, priority: 3 },
    { id: 5, priority: 'medium' }, { id: 6 },
  ];
  const { result } = renderHook(() => useFilteredTasks(tasks, filters));
  expect(result.current.map((task) => task.id)).toEqual([3, 4, 5, 2, 1, 6]);
  expect(tasks.map((task) => task.id)).toEqual([1, 2, 3, 4, 5, 6]);
});

test('filters both legacy numeric and named priorities', () => {
  const tasks = [{ priority: 3 }, { priority: 'high' }, { priority: 'low' }];
  const { result } = renderHook(() => useFilteredTasks(tasks, { ...filters, priority: 'high' }));
  expect(result.current).toEqual(tasks.slice(0, 2));
});

test('groups tasks by date, preserving order and excluding undated tasks', () => {
  const tasks = [
    { id: 1, due_date: '2026-11-07' }, { id: 2 },
    { id: 3, due_date: '2026-11-08' }, { id: 4, due_date: '2026-11-07' },
  ];
  expect(tasksByDate(tasks)).toEqual({
    '2026-11-07': [tasks[0], tasks[3]], '2026-11-08': [tasks[2]],
  });
});
