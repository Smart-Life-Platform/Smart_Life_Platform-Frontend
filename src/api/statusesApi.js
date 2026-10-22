import { apiClient } from './apiClient';

export const getStatuses = () => apiClient.get('/tasks/statuses/').then((response) => response.data);
