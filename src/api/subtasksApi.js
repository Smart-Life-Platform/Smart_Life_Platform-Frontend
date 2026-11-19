import { apiClient } from './apiClient';

const listOf = (data) => (Array.isArray(data) ? data : data?.results || []);

/** `GET /api/tasks/subtasks/?task_id=` */
export const getSubtasks = async (taskId) =>
  listOf((await apiClient.get('/tasks/subtasks/', { params: { task_id: taskId } })).data);

/** `POST /api/tasks/subtasks/` with { task, title, is_done, position } */
export const createSubtask = async (payload) => (await apiClient.post('/tasks/subtasks/', payload)).data;

/** `PATCH /api/tasks/subtasks/{id}/` — e.g. { is_done: true } */
export const updateSubtask = async (id, payload) => (await apiClient.patch(`/tasks/subtasks/${id}/`, payload)).data;

export const deleteSubtask = async (id) => {
  await apiClient.delete(`/tasks/subtasks/${id}/`);
};

/** Progress helper: a task exposes counters, but the checklist may be loaded separately. */
export const subtaskProgress = (task, subtasks) => {
  if (Array.isArray(subtasks)) {
    return {
      total: subtasks.length,
      done: subtasks.filter((item) => item.is_done ?? item.completed ?? item.done).length,
    };
  }
  const total = Number(task?.subtasks_count ?? 0) || 0;
  const done = Number(task?.completed_subtasks_count ?? 0) || 0;
  return { total, done: Math.min(done, total) };
};
