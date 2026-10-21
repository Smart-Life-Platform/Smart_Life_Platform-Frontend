import { apiClient } from './apiClient';

export const getTasks = () => apiClient.get('/tasks/tasks/', { params: { ordering: 'due_date' } }).then((response) => response.data);
export const createTask = (payload) => apiClient.post('/tasks/tasks/', payload).then((response) => response.data);
