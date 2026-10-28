import { apiClient } from '../api/apiClient';
import { getPriorities } from '../api/prioritiesApi';

jest.mock('../api/apiClient', () => ({ apiClient: { get: jest.fn() } }));

test('fetches task priorities and returns the response data', async () => {
  const priorities = [{ id: 1, name: 'High' }];
  apiClient.get.mockResolvedValue({ data: priorities });

  await expect(getPriorities()).resolves.toEqual(priorities);
  expect(apiClient.get).toHaveBeenCalledWith('/tasks/priorities/');
});
