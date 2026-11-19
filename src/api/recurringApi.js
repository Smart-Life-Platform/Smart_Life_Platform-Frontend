import { apiClient } from './apiClient';

const listOf = (data) => (Array.isArray(data) ? data : data?.results || []);

/** `GET /api/tasks/recurring-rules/?task_id=` */
export const getRecurringRules = async (taskId) =>
  listOf((await apiClient.get('/tasks/recurring-rules/', { params: { task_id: taskId } })).data);

/**
 * `POST /api/tasks/recurring-rules/`
 * {
 *   task, recurrence_type: 'daily' | 'weekly' | 'monthly' | 'custom',
 *   interval_value, weekdays: [0..6] (0 = Monday), start_date, end_date
 * }
 */
export const createRecurringRule = async (payload) => (await apiClient.post('/tasks/recurring-rules/', payload)).data;

export const updateRecurringRule = async (id, payload) =>
  (await apiClient.patch(`/tasks/recurring-rules/${id}/`, payload)).data;

export const deleteRecurringRule = async (id) => {
  await apiClient.delete(`/tasks/recurring-rules/${id}/`);
};
