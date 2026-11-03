import { apiClient } from './apiClient';

const priorityIds = { low: 1, medium: 2, high: 3, critical: 4 };

function normalizeRelationId(value) {
  if (Array.isArray(value)) return normalizeRelationId(value[0]);
  if (value && typeof value === 'object') return normalizeRelationId(value.id);
  if (value === '' || value === null || value === undefined) return null;

  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function normalizeTaskPayload(payload) {
  const normalized = { ...payload };

  if (typeof normalized.priority === 'string') {
    normalized.priority = priorityIds[normalized.priority.toLowerCase()] || normalized.priority;
  }

  if ('category_id' in normalized) {
    normalized.category_id = normalizeRelationId(normalized.category_id);
  }
  if ('status_id' in normalized) {
    normalized.status_id = normalizeRelationId(normalized.status_id);
  }
  if (normalized.due_time && /^\d{2}:\d{2}$/.test(normalized.due_time)) {
    normalized.due_time = `${normalized.due_time}:00`;
  }

  return normalized;
}

function normalizeTaskParams(params) {
  const normalized = { ...params };
  if (normalized.status_id !== undefined) {
    normalized.status = normalized.status_id;
    delete normalized.status_id;
  }
  if (normalized.category_id !== undefined) {
    normalized.category = normalized.category_id;
    delete normalized.category_id;
  }
  if (typeof normalized.priority === 'string' && !/^\d+$/.test(normalized.priority)) {
    normalized.priority = priorityIds[normalized.priority.toLowerCase()] || normalized.priority;
  }
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === '') delete normalized[key];
  });
  return normalized;
}

export const getTasks = (params = {}) => {
  const normalizedParams = normalizeTaskParams(params);
  return apiClient.get('/tasks/tasks/', { params: normalizedParams }).then((response) => response.data);
};
export const getOverdueTasks = () => apiClient.get('/tasks/tasks/overdue/').then((response) => response.data);
export const getTasksByDay = (params = {}) => apiClient.get('/tasks/tasks/by_day/', { params }).then((response) => response.data);
export const getTasksByWeek = (params = {}) => apiClient.get('/tasks/tasks/by_week/', { params }).then((response) => response.data);
export const getTasksByMonth = (params = {}) => apiClient.get('/tasks/tasks/by_month/', { params }).then((response) => response.data);
export const createTask = (payload) => apiClient.post('/tasks/tasks/', normalizeTaskPayload(payload)).then((response) => response.data);
export const updateTask = (id, payload) => apiClient.put(`/tasks/tasks/${id}/`, normalizeTaskPayload(payload)).then((response) => response.data);
export const deleteTask = (id) => apiClient.delete(`/tasks/tasks/${id}/`);
export const completeTask = (id) => apiClient.post(`/tasks/tasks/${id}/complete/`).then((response) => response.data);
export const setTaskStatus = (id, status) => apiClient.post(`/tasks/tasks/${id}/set_status/`, { status }).then((response) => response.data);
