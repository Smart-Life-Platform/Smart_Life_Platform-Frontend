import { apiClient } from './apiClient';

const listOf = (data) => (Array.isArray(data) ? data : data?.results || []);

/**
 * Boards belong to the signed-in account and are only ever read from the API.
 *
 * The previous implementation kept a copy in localStorage and fell back to it when
 * the API returned an empty list, so signing in as a second user showed the first
 * user's boards (they looked empty because their tasks do belong to the new user).
 * A cached list is also unsafe because board ids are only unique per account.
 */
export const getBoards = async () => {
  const response = await apiClient.get('/tasks/boards/');
  return listOf(response.data);
};

export const createBoard = async (payload) => {
  const response = await apiClient.post('/tasks/boards/', payload);
  return response.data;
};

export const updateBoard = async (id, payload) => {
  const response = await apiClient.put(`/tasks/boards/${id}/`, payload);
  return response.data;
};

export const deleteBoard = async (id) => {
  await apiClient.delete(`/tasks/boards/${id}/`);
};
