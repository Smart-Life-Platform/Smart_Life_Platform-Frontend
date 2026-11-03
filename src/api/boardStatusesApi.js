import { apiClient } from './apiClient';

/**
 * Board statuses.
 *
 * `/tasks/board-statuses/` returns the statuses of *all* boards of the user and
 * every status carries `board` (the board id). The previous implementation asked
 * the endpoint for one board and then stamped the requested board id onto every
 * returned status, so a status created on board A also appeared on board B, and
 * ids of "default" statuses collided across boards.
 *
 * The list is now fetched once, grouped by its own board field, and the callers
 * filter by board id locally. Switching boards therefore costs zero requests.
 */

const listOf = (data) => (Array.isArray(data) ? data : data?.results || []);

const boardIdOf = (status) => {
  const board = status?.board_id ?? status?.board;
  if (board === undefined || board === null || board === '') return null;
  return typeof board === 'object' ? board.id ?? null : board;
};

function normalize(status) {
  const position = Number(status.position ?? status.order ?? 0);
  return {
    ...status,
    board_id: boardIdOf(status),
    position,
    order: Number(status.order ?? status.position ?? 0),
  };
}

const byPosition = (first, second) => first.position - second.position;

let statusesByBoard = null;
let statusesRequest = null;
let legacyStatuses = null;

async function fetchLegacyStatuses() {
  // Older backends only expose /tasks/statuses/. Those statuses carry no board,
  // so they are treated as belonging to the default (first) board.
  if (legacyStatuses) return legacyStatuses;
  try {
    const response = await apiClient.get('/tasks/statuses/');
    legacyStatuses = listOf(response.data).map(normalize).sort(byPosition);
  } catch {
    legacyStatuses = [];
  }
  return legacyStatuses;
}

async function fetchAllStatuses() {
  if (statusesByBoard) return statusesByBoard;
  if (!statusesRequest) {
    statusesRequest = apiClient
      .get('/tasks/board-statuses/')
      .then((response) => listOf(response.data).map(normalize).sort(byPosition))
      .catch(() => fetchLegacyStatuses())
      .then((list) => {
        statusesByBoard = list;
        return list;
      })
      .finally(() => {
        statusesRequest = null;
      });
  }
  return statusesRequest;
}

function updateCache(mutate) {
  if (statusesByBoard) statusesByBoard = mutate([...statusesByBoard]).sort(byPosition);
}

export function invalidateBoardStatuses() {
  statusesByBoard = null;
  legacyStatuses = null;
}

/** Statuses of every board of the current user (one request per session). */
export const getAllBoardStatuses = () => fetchAllStatuses();

/** Statuses that belong to one board only. */
export const getBoardStatuses = async (boardId) => {
  const all = await fetchAllStatuses();
  if (!boardId) return all;
  return all.filter((status) => String(status.board_id) === String(boardId));
};

export const createBoardStatus = async (payload) => {
  const boardId = payload.board_id ?? null;
  let created = null;

  try {
    const response = await apiClient.post('/tasks/board-statuses/', payload);
    created = response.data;
  } catch (error) {
    const response = await apiClient.post('/tasks/statuses/', {
      name: payload.name,
      order: payload.position || payload.order || 1,
    });
    created = response.data;
  }

  const result = normalize({ ...created, board: created?.board ?? boardId });
  updateCache((current) => [...current.filter((item) => String(item.id) !== String(result.id)), result]);
  return result;
};

export const updateBoardStatus = async (id, payload) => {
  let updated = null;

  try {
    const response = await apiClient.put(`/tasks/board-statuses/${id}/`, payload);
    updated = response.data;
  } catch (error) {
    const response = await apiClient.put(`/tasks/statuses/${id}/`, {
      name: payload.name,
      order: payload.position || payload.order || 1,
    });
    updated = response.data;
  }

  updateCache((current) =>
    current.map((item) =>
      String(item.id) === String(id) ? normalize({ ...item, ...payload, ...updated }) : item
    )
  );
  return updated || { id, ...payload };
};

export const saveBoardStatusesOrder = async (_boardId, orderedStatuses) => {
  const positions = new Map(orderedStatuses.map((status, index) => [String(status.id), index + 1]));
  updateCache((current) =>
    current.map((status) =>
      positions.has(String(status.id))
        ? { ...status, position: positions.get(String(status.id)), order: positions.get(String(status.id)) }
        : status
    )
  );
};

export const deleteBoardStatus = async (id) => {
  try {
    await apiClient.delete(`/tasks/board-statuses/${id}/`);
  } catch (error) {
    await apiClient.delete(`/tasks/statuses/${id}/`);
  }
  updateCache((current) => current.filter((item) => String(item.id) !== String(id)));
};
