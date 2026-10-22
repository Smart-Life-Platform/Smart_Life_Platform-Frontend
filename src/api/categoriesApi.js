import { apiClient } from './apiClient';

export const getCategories = () => apiClient.get('/tasks/categories/').then((response) => response.data);
