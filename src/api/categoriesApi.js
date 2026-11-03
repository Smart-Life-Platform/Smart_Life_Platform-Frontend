import { apiClient } from './apiClient';

export const getCategories = (boardId) => {
  const request = boardId
    ? apiClient.get('/tasks/categories/', { params: { board: boardId } })
    : apiClient.get('/tasks/categories/');
  return request.then((response) => response.data);
};
export const createCategory = (payload) => apiClient.post('/tasks/categories/', payload).then((response) => response.data);
