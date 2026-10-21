import { apiClient } from './apiClient';

export const loginUser = (credentials) => apiClient.post('/auth/users/login/', credentials).then((response) => response.data);
export const registerUser = (credentials) => apiClient.post('/auth/users/register/', credentials).then((response) => response.data);
