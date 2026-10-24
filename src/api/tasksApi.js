import { apiClient } from './apiClient';

const priorityValues = ['low', 'medium', 'high'];

function normalizeRelationId(value) {
  if (Array.isArray(value)) return normalizeRelationId(value[0]);
  if (value && typeof value === 'object') return normalizeRelationId(value.id);
  if (value === '' || value === null || value === undefined) return null;

  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

function normalizeTaskPayload(payload) {
  const normalized = { ...payload };

  if ('category_id' in normalized) {
    normalized.category_id = normalizeRelationId(normalized.category_id);
  }
  if ('status_id' in normalized) {
    normalized.status_id = normalizeRelationId(normalized.status_id);
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
  if (typeof normalized.priority === 'number' || /^\d+$/.test(String(normalized.priority || ''))) {
    normalized.priority = priorityValues[Number(normalized.priority) - 1] || normalized.priority;
  }
  return normalized;
}

export const getTasks = (params = {}) => apiClient.get('/tasks/tasks/', {
  params: { ordering: 'due_date', ...normalizeTaskParams(params) },
}).then((response) => response.data);
export const createTask = (payload) => apiClient.post('/tasks/tasks/', normalizeTaskPayload(payload)).then((response) => response.data);
export const updateTask = (id, payload) => apiClient.put(`/tasks/tasks/${id}/`, normalizeTaskPayload(payload)).then((response) => response.data);
export const deleteTask = (id) => apiClient.delete(`/tasks/tasks/${id}/`);
