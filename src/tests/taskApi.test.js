import { apiClient } from '../api/apiClient';
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from '../api/tasksApi';

jest.mock('../api/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

beforeEach(() => jest.clearAllMocks());

test('normalizes task filters and returns task data', async () => {
  apiClient.get.mockResolvedValue({ data: [] });

  await getTasks({ status_id: 2, category_id: 3, priority: 1, ordering: '-due_date' });

  expect(apiClient.get).toHaveBeenCalledWith('/tasks/tasks/', {
    params: { status: 2, category: 3, priority: 'low' },
  });
});

test('normalizes relations when creating and updating tasks', async () => {
  apiClient.post.mockResolvedValue({ data: { id: 1 } });
  apiClient.put.mockResolvedValue({ data: { id: 1 } });
  const payload = { title: 'Plan', category_id: { id: 4 }, status_id: [5] };

  await createTask(payload);
  await updateTask(1, payload);

  expect(apiClient.post).toHaveBeenCalledWith('/tasks/tasks/', {
    title: 'Plan',
    category_id: 4,
    status_id: 5,
  });
  expect(apiClient.put).toHaveBeenCalledWith('/tasks/tasks/1/', {
    title: 'Plan',
    category_id: 4,
    status_id: 5,
  });
});

test('deletes a task by id', async () => {
  apiClient.delete.mockResolvedValue({});

  await deleteTask(7);

  expect(apiClient.delete).toHaveBeenCalledWith('/tasks/tasks/7/');
});
