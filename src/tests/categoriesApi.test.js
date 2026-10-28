import { apiClient } from '../api/apiClient';
import { getCategories } from '../api/categoriesApi';

jest.mock('../api/apiClient', () => ({ apiClient: { get: jest.fn() } }));

test('fetches task categories and returns the response data', async () => {
  const categories = [{ id: 1, name: 'Work' }];
  apiClient.get.mockResolvedValue({ data: categories });

  await expect(getCategories()).resolves.toEqual(categories);
  expect(apiClient.get).toHaveBeenCalledWith('/tasks/categories/');
});
