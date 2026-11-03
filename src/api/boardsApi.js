import { apiClient } from './apiClient';

const BOARDS_STORAGE_KEY = 'avenor_boards';

const getDefaultBoards = () => [
  { id: 1, name: 'Main Board', description: 'Personal workspace board' },
];

export const getBoards = async () => {
  try {
    const response = await apiClient.get('/tasks/boards/');
    const data = response.data;
    const boards = Array.isArray(data) ? data : data?.results || [];
    if (boards.length > 0) {
      window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(boards));
      return boards;
    }
  } catch (error) {
    // If backend doesn't support /tasks/boards/ endpoint, fallback to localStorage
  }

  const raw = window.localStorage.getItem(BOARDS_STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }

  const defaults = getDefaultBoards();
  window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
};

export const createBoard = async (payload) => {
  try {
    const response = await apiClient.post('/tasks/boards/', payload);
    const created = response.data;
    const existing = await getBoards().catch(() => []);
    const updated = [...existing.filter((b) => b.id !== created.id), created];
    window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(updated));
    return created;
  } catch (error) {
    const fallbackBoard = {
      id: Date.now(),
      name: payload.name,
      description: payload.description || '',
      icon: payload.icon || '',
      color: payload.color || '#6d5ce7',
      created_at: new Date().toISOString(),
    };
    const existing = await getBoards().catch(() => []);
    const updated = [...existing, fallbackBoard];
    window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(updated));
    return fallbackBoard;
  }
};

export const updateBoard = async (id, payload) => {
  try {
    const response = await apiClient.put(`/tasks/boards/${id}/`, payload);
    return response.data;
  } catch (error) {
    const existing = await getBoards().catch(() => []);
    const updated = existing.map((b) => (String(b.id) === String(id) ? { ...b, ...payload } : b));
    window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(updated));
    return { id, ...payload };
  }
};

export const deleteBoard = async (id) => {
  try {
    await apiClient.delete(`/tasks/boards/${id}/`);
  } catch (error) {}
  const existing = await getBoards().catch(() => []);
  const updated = existing.filter((b) => String(b.id) !== String(id));
  window.localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(updated));
};
