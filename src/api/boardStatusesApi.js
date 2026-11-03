import { apiClient } from './apiClient';

const STATUSES_STORAGE_KEY_PREFIX = 'avenor_board_statuses_';

function getStoredBoardStatuses(boardId) {
  if (!boardId) return null;
  try {
    const raw = window.localStorage.getItem(STATUSES_STORAGE_KEY_PREFIX + boardId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredBoardStatusesList(boardId, list) {
  if (!boardId) return;
  try {
    window.localStorage.setItem(STATUSES_STORAGE_KEY_PREFIX + boardId, JSON.stringify(list));
  } catch {}
}

function isDefaultBoard(boardId) {
  try {
    const raw = window.localStorage.getItem('avenor_boards');
    const boards = raw ? JSON.parse(raw) : [];
    if (!boards.length) return true;
    const defaultId = boards[0]?.id;
    return defaultId !== undefined && String(defaultId) === String(boardId);
  } catch {
    return true;
  }
}

export const getBoardStatuses = async (boardId) => {
  try {
    const response = await apiClient.get('/tasks/board-statuses/', {
      params: boardId ? { board: boardId } : undefined,
    });
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data.map((s) => ({ ...s, board_id: boardId }));
    }
  } catch (error) {
    // Backend doesn't support /tasks/board-statuses/, check local storage
  }

  // Check if we have statuses saved locally for this specific board
  if (boardId) {
    const stored = getStoredBoardStatuses(boardId);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
  }

  // Only the first/default board gets initial default statuses!
  // Subsequent boards (second board, etc.) start empty until user adds statuses to them!
  const isDefault = !boardId || isDefaultBoard(boardId);
  if (isDefault) {
    let defaultList = [];
    try {
      const response = await apiClient.get('/tasks/statuses/');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) {
        defaultList = data.map((s) => ({ ...s, board_id: boardId }));
      }
    } catch {}

    if (defaultList.length === 0) {
      defaultList = [
        { id: 1, name: 'To Do', order: 1, position: 1, board_id: boardId },
        { id: 2, name: 'In Progress', order: 2, position: 2, board_id: boardId },
        { id: 3, name: 'Done', order: 3, position: 3, board_id: boardId },
      ];
    }

    if (boardId) {
      setStoredBoardStatusesList(boardId, defaultList);
    }
    return defaultList;
  }

  // Second board (or any other board) starts empty!
  return [];
};

export const createBoardStatus = async (payload) => {
  const boardId = payload.board_id;
  let created = null;
  try {
    const response = await apiClient.post('/tasks/board-statuses/', payload);
    created = response.data;
  } catch (error) {
    try {
      const response = await apiClient.post('/tasks/statuses/', {
        name: payload.name,
        order: payload.position || payload.order || 1,
      });
      created = response.data;
    } catch {
      created = {
        id: Date.now(),
        name: payload.name,
        order: payload.position || 1,
        position: payload.position || 1,
        color: payload.color || '#6d5ce7',
      };
    }
  }

  const result = { ...created, board_id: boardId };
  if (boardId) {
    const currentList = getStoredBoardStatuses(boardId) || [];
    const updated = [...currentList.filter((item) => String(item.id) !== String(result.id)), result];
    setStoredBoardStatusesList(boardId, updated);
  }
  return result;
};

export const updateBoardStatus = async (id, payload) => {
  let updated = null;
  try {
    const response = await apiClient.put(`/tasks/board-statuses/${id}/`, payload);
    updated = response.data;
  } catch (error) {
    try {
      const response = await apiClient.put(`/tasks/statuses/${id}/`, {
        name: payload.name,
        order: payload.position || payload.order || 1,
      });
      updated = response.data;
    } catch {
      updated = { id, ...payload };
    }
  }

  const boardId = payload?.board_id;
  if (boardId) {
    const currentList = getStoredBoardStatuses(boardId) || [];
    const updatedList = currentList.map((item) =>
      String(item.id) === String(id) ? { ...item, ...payload, ...updated } : item
    );
    updatedList.sort((a, b) => Number(a.position || a.order || 0) - Number(b.position || b.order || 0));
    setStoredBoardStatusesList(boardId, updatedList);
  }
  return updated || { id, ...payload };
};

export const saveBoardStatusesOrder = async (boardId, orderedStatuses) => {
  if (boardId) {
    const normalized = orderedStatuses.map((s, index) => ({
      ...s,
      position: index + 1,
      order: index + 1,
      board_id: boardId,
    }));
    setStoredBoardStatusesList(boardId, normalized);
  }
};

export const deleteBoardStatus = async (id, boardId) => {
  try {
    await apiClient.delete(`/tasks/board-statuses/${id}/`);
  } catch (error) {
    try {
      await apiClient.delete(`/tasks/statuses/${id}/`);
    } catch {}
  }
  if (boardId) {
    const currentList = getStoredBoardStatuses(boardId) || [];
    const updatedList = currentList.filter((item) => String(item.id) !== String(id));
    setStoredBoardStatusesList(boardId, updatedList);
  }
};
