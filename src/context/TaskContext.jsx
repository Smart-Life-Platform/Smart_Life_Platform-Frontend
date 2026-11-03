import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { deleteTask as deleteTaskRequest, getOverdueTasks, getTasks, getTasksByDay, getTasksByMonth, getTasksByWeek, createTask as createTaskRequest, updateTask as updateTaskRequest, setTaskStatus as setTaskStatusRequest } from '../api/tasksApi';
import { createBoard, getBoards, updateBoard } from '../api/boardsApi';
import { createCategory, getCategories } from '../api/categoriesApi';
import { createBoardStatus, getAllBoardStatuses, updateBoardStatus, saveBoardStatusesOrder } from '../api/boardStatusesApi';
import { getPriorities } from '../api/prioritiesApi';
import {
  setStoredTaskBoard,
  removeStoredTaskBoard,
  setStoredCategoryBoard,
  setStoredStatusBoard,
  statusBelongsToBoard,
  categoryBelongsToBoard,
} from '../utils/boardScope';

const TaskContext = createContext(null);

const listOf = (data) => (Array.isArray(data) ? data : data?.results || []);

function taskList(data) {
  if (Array.isArray(data)) return data;
  return data?.results || data?.tasks || data?.overdue_tasks || [];
}

const boardIdOf = (item) => {
  const board = item?.board_id ?? item?.board;
  if (board === undefined || board === null || board === '') return null;
  return typeof board === 'object' ? board.id ?? null : board;
};

const byPosition = (first, second) =>
  Number(first.position ?? first.order ?? 0) - Number(second.position ?? second.order ?? 0);

export function TaskProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  // Full lists for every board. `statuses` and `categories` below expose only the
  // active board, so switching boards is a local operation with no extra requests.
  const [allStatuses, setAllStatuses] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const taskRequestId = useRef(0);
  const calendarRequestId = useRef(0);

  const activeBoardId = activeBoard?.id;
  const defaultBoardId = boards[0]?.id;

  const statuses = useMemo(() => {
    if (!activeBoardId) return allStatuses;
    return allStatuses.filter((status) => statusBelongsToBoard(status, activeBoardId, defaultBoardId));
  }, [allStatuses, activeBoardId, defaultBoardId]);

  const categories = useMemo(() => {
    if (!activeBoardId) return allCategories;
    return allCategories.filter((category) => categoryBelongsToBoard(category, activeBoardId, defaultBoardId));
  }, [allCategories, activeBoardId, defaultBoardId]);

  const loadTasks = useCallback(async (params) => {
    const requestId = ++taskRequestId.current;
    setLoading(true);
    try {
      const data = await getTasks({ ...(activeBoard ? { board: activeBoard.id } : {}), ...params });
      if (requestId !== taskRequestId.current) return;
      setTasks(taskList(data));

      try {
        const overdueData = await getOverdueTasks();
        if (requestId === taskRequestId.current) setOverdueTasks(taskList(overdueData));
      } catch (overdueError) {
        console.error('Unable to load overdue tasks:', overdueError);
        if (requestId === taskRequestId.current) setOverdueTasks([]);
      }
    } finally {
      if (requestId === taskRequestId.current) setLoading(false);
    }
  }, [activeBoard]);

  const loadCalendarTasks = useCallback(async (view, date) => {
    const requestId = ++calendarRequestId.current;
    setCalendarTasks([]);
    const params = { ...(activeBoard ? { board: activeBoard.id } : {}), date };
    const request = view === 'month' ? getTasksByMonth : view === 'week' ? getTasksByWeek : getTasksByDay;
    const data = await request(params);
    if (requestId === calendarRequestId.current) setCalendarTasks(taskList(data));
  }, [activeBoard]);

  /**
   * Loads every list once. Deliberately independent of `activeBoard`: re-running it
   * on each board change was the source of the repeated request bursts. Statuses and
   * categories arrive for all boards and are filtered locally by `board`.
   */
  const loadMetadata = useCallback(async () => {
    const boardData = await getBoards();
    const availableBoards = listOf(boardData);
    setBoards(availableBoards);

    setActiveBoard((current) => {
      if (!current) return availableBoards[0] || null;
      return availableBoards.some((board) => String(board.id) === String(current.id))
        ? current
        : availableBoards[0] || null;
    });

    const [statusData, categoryData, priorityData] = await Promise.all([
      getAllBoardStatuses(),
      getCategories(),
      getPriorities(),
    ]);

    const nextStatuses = listOf(statusData).map((status) => {
      const boardId = boardIdOf(status);
      if (boardId && status.id) setStoredStatusBoard(status.id, boardId);
      return { ...status, board_id: boardId };
    });
    setAllStatuses(nextStatuses.sort(byPosition));

    const nextCategories = listOf(categoryData).map((category) => {
      const boardId = boardIdOf(category);
      if (boardId && category.id) setStoredCategoryBoard(category.id, boardId);
      return { ...category, board_id: boardId };
    });
    setAllCategories(nextCategories);

    const availablePriorities = listOf(priorityData);
    setPriorities(availablePriorities.map((priority) => {
      const value = Number(priority);
      return ['low', 'medium', 'high', 'critical'][value - 1] || String(priority);
    }));
  }, []);

  const addCategory = useCallback(async (payload) => {
    const categoryPayload = typeof payload === 'string' ? { name: payload } : payload;
    const name = categoryPayload.name;
    if (!activeBoard?.id || !name.trim()) return null;
    const category = await createCategory({ board_id: activeBoard.id, ...categoryPayload, name: name.trim() });
    const createdCategory = { board_id: activeBoard.id, ...category };
    if (createdCategory?.id) {
      setStoredCategoryBoard(createdCategory.id, activeBoard.id);
    }
    setAllCategories((current) => [...current, createdCategory]);
    return createdCategory;
  }, [activeBoard]);

  const addStatus = useCallback(async (payload) => {
    const statusPayload = typeof payload === 'string' ? { name: payload } : payload;
    const name = statusPayload.name;
    if (!activeBoard?.id || !name.trim()) return null;
    const nextPosition = statusPayload.position || statuses.length + 1;
    const status = await createBoardStatus({
      board_id: activeBoard.id,
      ...statusPayload,
      name: name.trim(),
      position: nextPosition,
      order: nextPosition,
    });
    const createdStatus = { ...status, board_id: status.board_id ?? activeBoard.id };
    if (createdStatus?.id) {
      setStoredStatusBoard(createdStatus.id, activeBoard.id);
    }
    setAllStatuses((current) =>
      [...current.filter((item) => String(item.id) !== String(createdStatus.id)), createdStatus].sort(byPosition)
    );
    return createdStatus;
  }, [activeBoard, statuses]);

  const saveStatusOrder = useCallback(async (orderedStatuses) => {
    const boardId = activeBoard?.id;
    const normalized = orderedStatuses.map((status, index) => ({
      ...status,
      position: index + 1,
      order: index + 1,
      board_id: status.board_id ?? boardId,
    }));

    const previousPositions = new Map(
      statuses.map((status) => [String(status.id), Number(status.position ?? status.order ?? 0)])
    );
    const positionsById = new Map(normalized.map((status) => [String(status.id), status]));
    setAllStatuses((current) =>
      current.map((status) => {
        const next = positionsById.get(String(status.id));
        return next ? { ...status, ...next } : status;
      })
    );

    await saveBoardStatusesOrder(boardId, normalized).catch(() => {});

    // Only statuses whose position actually changed are sent to the backend.
    const changed = normalized.filter(
      (status) => previousPositions.get(String(status.id)) !== status.position
    );
    await Promise.all(
      changed.map((status) =>
        updateBoardStatus(status.id, {
          position: status.position,
          order: status.order,
          board_id: status.board_id ?? boardId,
          name: status.name,
        }).catch(() => {})
      )
    );
  }, [activeBoard, statuses]);

  const createBoardForUser = useCallback(async (payload) => {
    const board = await createBoard(payload);
    setBoards((current) => [...current, board]);
    setActiveBoard(board);
    return board;
  }, []);

  const saveBoard = useCallback(async (id, payload) => {
    const board = await updateBoard(id, payload);
    setBoards((current) => current.map((item) => item.id === id ? { ...item, ...board } : item));
    setActiveBoard((current) => current?.id === id ? { ...current, ...board } : current);
    return board;
  }, []);

  const createTask = useCallback(async (payload) => {
    const boardId = activeBoard?.id;
    const taskPayload = {
      ...(boardId ? { board: boardId, board_id: boardId } : {}),
      ...payload,
    };
    const task = await createTaskRequest(taskPayload);
    const createdTask = {
      ...(boardId ? { board: boardId, board_id: boardId } : {}),
      ...task,
    };
    if (boardId && createdTask?.id) {
      setStoredTaskBoard(createdTask.id, boardId);
    }
    setTasks((current) => [...current, createdTask]);
    setCalendarTasks((current) => [...current, createdTask]);
    getOverdueTasks().then((data) => setOverdueTasks(taskList(data))).catch((error) => {
      console.error('Unable to refresh overdue tasks:', error);
    });
    return createdTask;
  }, [activeBoard]);

  const updateTask = useCallback(async (id, payload) => {
    const currentTask = tasks.find((item) => item.id === id);
    const boardId = currentTask?.board_id ?? currentTask?.board ?? activeBoard?.id;
    const task = await updateTaskRequest(id, {
      ...(boardId ? { board: boardId, board_id: boardId } : {}),
      ...payload,
    });
    const updatedTask = {
      ...(boardId ? { board: boardId, board_id: boardId } : {}),
      ...task,
    };
    if (boardId) {
      setStoredTaskBoard(id, boardId);
    }
    setTasks((current) => current.map((item) => (item.id === id ? { ...item, ...updatedTask } : item)));
    setCalendarTasks((current) => current.map((item) => (item.id === id ? { ...item, ...updatedTask } : item)));
    getOverdueTasks().then((data) => setOverdueTasks(taskList(data))).catch((error) => {
      console.error('Unable to refresh overdue tasks:', error);
    });
    return updatedTask;
  }, [activeBoard, tasks]);

  const setTaskStatus = useCallback(async (id, statusOrName, statusId) => {
    const statusName = typeof statusOrName === 'string' ? statusOrName : statusOrName?.name;
    const resolvedStatusId = statusId ?? (typeof statusOrName === 'object' ? statusOrName?.id : undefined);

    let task;
    try {
      task = await setTaskStatusRequest(id, statusName);
    } catch (setStatusError) {
      if (resolvedStatusId !== undefined) {
        task = await updateTaskRequest(id, { status_id: resolvedStatusId });
      } else {
        throw setStatusError;
      }
    }

    const updatedTaskPatch = {
      ...task,
      ...(resolvedStatusId !== undefined ? { status_id: resolvedStatusId } : {}),
      ...(statusName ? { status_name: statusName } : {}),
    };

    setTasks((current) => current.map((item) => (item.id === id ? { ...item, ...updatedTaskPatch } : item)));
    setCalendarTasks((current) => current.map((item) => (item.id === id ? { ...item, ...updatedTaskPatch } : item)));
    return updatedTaskPatch;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await deleteTaskRequest(id);
    removeStoredTaskBoard(id);
    setTasks((current) => current.filter((item) => item.id !== id));
    setCalendarTasks((current) => current.filter((item) => item.id !== id));
    getOverdueTasks().then((data) => setOverdueTasks(taskList(data))).catch((error) => {
      console.error('Unable to refresh overdue tasks:', error);
    });
  }, []);

  const value = useMemo(() => ({
    tasks,
    overdueTasks,
    calendarTasks,
    statuses,
    categories,
    priorities,
    boards,
    activeBoard,
    setActiveBoard,
    loading,
    loadTasks,
    loadCalendarTasks,
    loadMetadata,
    addCategory,
    addStatus,
    saveStatusOrder,
    createBoardForUser,
    saveBoard,
    createTask,
    updateTask,
    setTaskStatus,
    deleteTask,
  }), [
    tasks, overdueTasks, calendarTasks, statuses, categories, priorities, boards,
    activeBoard, loading, loadTasks, loadCalendarTasks, loadMetadata, addCategory,
    addStatus, saveStatusOrder, createBoardForUser, saveBoard, createTask, updateTask,
    setTaskStatus, deleteTask,
  ]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used inside TaskProvider');
  return context;
}
