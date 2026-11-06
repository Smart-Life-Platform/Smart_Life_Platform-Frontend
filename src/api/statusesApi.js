import { apiClient } from './apiClient';

export const getStatuses = () => apiClient.get('/tasks/statuses/').then((response) => response.data);
export const getBoardStatuses = (boardId) => {
  const request = boardId
    ? apiClient.get('/tasks/board-statuses/', { params: { board: boardId } })
    : apiClient.get('/tasks/board-statuses/');
  return request.then((response) => response.data);
};
