import { act, renderHook } from '@testing-library/react';
import { TaskProvider, useTaskContext } from '../context/TaskContext';
import { createTask, getTasksByDay, getTasks, getOverdueTasks } from '../api/tasksApi';

jest.mock('../api/tasksApi', () => ({
  createTask: jest.fn(), getTasksByDay: jest.fn(), getTasks: jest.fn(),
  getOverdueTasks: jest.fn(),
}));
jest.mock('../api/categoriesApi', () => ({ getCategories: jest.fn() }));
jest.mock('../api/statusesApi', () => ({ getStatuses: jest.fn() }));
jest.mock('../api/prioritiesApi', () => ({ getPriorities: jest.fn() }));

beforeEach(() => {
  jest.resetAllMocks();
  getOverdueTasks.mockResolvedValue([]);
});

test('a slow calendar response cannot replace the latest selected day', async () => {
  let finishOldRequest;
  getTasksByDay.mockImplementationOnce(() => new Promise((resolve) => { finishOldRequest = resolve; }))
    .mockResolvedValueOnce([{ id: 2 }]);
  const { result } = renderHook(useTaskContext, { wrapper: TaskProvider });
  let oldRequest;
  act(() => { oldRequest = result.current.loadCalendarTasks('day', '2026-10-30'); });
  await act(async () => { await result.current.loadCalendarTasks('day', '2026-10-31'); });
  await act(async () => { finishOldRequest([{ id: 1 }]); await oldRequest; });
  expect(result.current.calendarTasks).toEqual([{ id: 2 }]);
});

test('a slow search cannot overwrite results from a newer search', async () => {
  let finishOldRequest;
  getTasks.mockImplementationOnce(() => new Promise((resolve) => { finishOldRequest = resolve; }))
    .mockResolvedValueOnce([{ id: 2 }]);
  const { result } = renderHook(useTaskContext, { wrapper: TaskProvider });
  let oldRequest;
  act(() => { oldRequest = result.current.loadTasks({ search: 'old' }); });
  await act(async () => { await result.current.loadTasks({ search: 'new' }); });
  await act(async () => { finishOldRequest([{ id: 1 }]); await oldRequest; });
  expect(result.current.tasks).toEqual([{ id: 2 }]);
  expect(result.current.loading).toBe(false);
});

test('a new task appears immediately in the list and calendar', async () => {
  const task = { id: 3, title: 'New task', due_date: '2026-10-31' };
  createTask.mockResolvedValue(task);
  const { result } = renderHook(useTaskContext, { wrapper: TaskProvider });
  await act(async () => { await result.current.createTask(task); });
  expect(result.current.tasks).toEqual([task]);
  expect(result.current.calendarTasks).toEqual([task]);
});
