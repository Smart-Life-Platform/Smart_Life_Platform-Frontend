import { apiClient } from './apiClient';
import { priorityName } from '../utils/priority';

function normalizeRelationId(value) {
  if (Array.isArray(value)) return normalizeRelationId(value[0]);
  if (value && typeof value === 'object') return normalizeRelationId(value.id);
  if (value === '' || value === null || value === undefined) return null;

  const id = Number(value);
  return Number.isInteger(id) ? id : null;
}

/**
 * Assignees are users, and a user id is not necessarily numeric — the API issues
 * UUIDs. Keep such an id as a string instead of nulling it the way a board
 * relation (status / category) would be.
 */
function normalizeAssigneeId(value) {
  if (Array.isArray(value)) return normalizeAssigneeId(value[0]);
  if (value && typeof value === 'object') return normalizeAssigneeId(value.id);
  if (value === '' || value === null || value === undefined) return null;

  const text = String(value).trim();
  if (!text) return null;
  const id = Number(text);
  return Number.isInteger(id) ? id : text;
}

function normalizeTaskPayload(payload) {
  const normalized = { ...payload };

  if ('priority' in normalized) {
    const name = priorityName(normalized.priority);
    if (name) normalized.priority = name;
    // Never send a value the API cannot validate — let the backend keep its default.
    else delete normalized.priority;
  }

  if ('category_id' in normalized) {
    normalized.category_id = normalizeRelationId(normalized.category_id);
  }
  if ('status_id' in normalized) {
    normalized.status_id = normalizeRelationId(normalized.status_id);
  }
  // Assignee must be a member of the board; null unassigns the task.
  if ('assignee_id' in normalized) {
    normalized.assignee_id = normalizeAssigneeId(normalized.assignee_id);
  }
  if (normalized.due_time && /^\d{2}:\d{2}$/.test(normalized.due_time)) {
    normalized.due_time = `${normalized.due_time}:00`;
  }

  return normalized;
}

function normalizeTaskParams(params) {
  const normalized = { ...params };

  // Listing filters by `board_id`; the write payload keeps using `board`.
  if (normalized.board !== undefined) {
    normalized.board_id = normalized.board;
    delete normalized.board;
  }
  if (normalized.status_id !== undefined) {
    normalized.status = normalized.status_id;
    delete normalized.status_id;
  }
  if (normalized.category_id !== undefined) {
    normalized.category = normalized.category_id;
    delete normalized.category_id;
  }
  if (normalized.priority !== undefined) {
    const name = priorityName(normalized.priority);
    if (name) normalized.priority = name;
    else delete normalized.priority;
  }
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === '') delete normalized[key];
  });
  return normalized;
}

export const getTask = (id) => apiClient.get(`/tasks/tasks/${id}/`).then((response) => response.data);

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
export const patchTask = (id, payload) => apiClient.patch(`/tasks/tasks/${id}/`, normalizeTaskPayload(payload)).then((response) => response.data);
export const deleteTask = (id) => apiClient.delete(`/tasks/tasks/${id}/`);
export const completeTask = (id) => apiClient.post(`/tasks/tasks/${id}/complete/`).then((response) => response.data);
export const setTaskStatus = (id, status) => apiClient.post(`/tasks/tasks/${id}/set_status/`, { status }).then((response) => response.data);
