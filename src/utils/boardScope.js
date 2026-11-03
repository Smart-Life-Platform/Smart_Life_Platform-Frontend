const TASK_BOARD_KEY = 'avenor_board_tasks';
const STATUS_BOARD_KEY = 'avenor_board_statuses';
const CATEGORY_BOARD_KEY = 'avenor_board_categories';

function getStorageMap(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStorageMap(key, map) {
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {}
}

export function getStoredTaskBoard(taskId) {
  if (!taskId) return null;
  const map = getStorageMap(TASK_BOARD_KEY);
  return map[String(taskId)] || null;
}

export function setStoredTaskBoard(taskId, boardId) {
  if (!taskId || !boardId) return;
  const map = getStorageMap(TASK_BOARD_KEY);
  map[String(taskId)] = String(boardId);
  setStorageMap(TASK_BOARD_KEY, map);
}

export function removeStoredTaskBoard(taskId) {
  if (!taskId) return;
  const map = getStorageMap(TASK_BOARD_KEY);
  delete map[String(taskId)];
  setStorageMap(TASK_BOARD_KEY, map);
}

export function getStoredStatusBoard(statusId) {
  if (!statusId) return null;
  const map = getStorageMap(STATUS_BOARD_KEY);
  return map[String(statusId)] || null;
}

export function setStoredStatusBoard(statusId, boardId) {
  if (!statusId || !boardId) return;
  const map = getStorageMap(STATUS_BOARD_KEY);
  map[String(statusId)] = String(boardId);
  setStorageMap(STATUS_BOARD_KEY, map);
}

export function getStoredCategoryBoard(categoryId) {
  if (!categoryId) return null;
  const map = getStorageMap(CATEGORY_BOARD_KEY);
  return map[String(categoryId)] || null;
}

export function setStoredCategoryBoard(categoryId, boardId) {
  if (!categoryId || !boardId) return;
  const map = getStorageMap(CATEGORY_BOARD_KEY);
  map[String(categoryId)] = String(boardId);
  setStorageMap(CATEGORY_BOARD_KEY, map);
}

export function taskBelongsToBoard(task, boardId, defaultBoardId) {
  if (!boardId) return false;
  const taskBoardId = task.board_id ?? task.board?.id ?? task.board ?? getStoredTaskBoard(task.id);
  if (taskBoardId !== undefined && taskBoardId !== null && taskBoardId !== '') {
    return String(taskBoardId) === String(boardId);
  }
  return defaultBoardId ? String(boardId) === String(defaultBoardId) : false;
}

export function statusBelongsToBoard(status, boardId, defaultBoardId) {
  if (!boardId) return false;
  const statusBoardId = status.board_id ?? status.board?.id ?? status.board ?? getStoredStatusBoard(status.id);
  if (statusBoardId !== undefined && statusBoardId !== null && statusBoardId !== '') {
    return String(statusBoardId) === String(boardId);
  }
  return defaultBoardId ? String(boardId) === String(defaultBoardId) : false;
}

export function categoryBelongsToBoard(category, boardId, defaultBoardId) {
  if (!boardId) return false;
  const categoryBoardId = category.board_id ?? category.board?.id ?? category.board ?? getStoredCategoryBoard(category.id);
  if (categoryBoardId !== undefined && categoryBoardId !== null && categoryBoardId !== '') {
    return String(categoryBoardId) === String(boardId);
  }
  return defaultBoardId ? String(boardId) === String(defaultBoardId) : false;
}
