import { apiClient } from './apiClient';

export const getPriorities = () => apiClient.get('/tasks/priorities/').then((response) => response.data);
