import { apiClient } from './apiClient';

export const getTasks = () => apiClient.get('/tasks/tasks/', { params: { ordering: 'due_date' } }).then((response) => response.data);
export const createTask = (payload) => apiClient.post('/tasks/tasks/', payload).then((response) => response.data);
export const updateTask = (id, payload) => apiClient.put(`/tasks/tasks/${id}/`, payload).then((response) => response.data);
export const deleteTask = (id) => apiClient.delete(`/tasks/tasks/${id}/`);
