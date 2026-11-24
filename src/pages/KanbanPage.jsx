import { useCallback, useEffect, useState } from 'react';
import TaskForm from '../components/tasks/TaskForm';
import KanbanBoard from '../components/kanban/KanbanBoard';
import KanbanHeader from '../components/kanban/KanbanHeader';
import KanbanToolbar from '../components/kanban/KanbanToolbar';
import MetadataModal from '../components/kanban/MetadataModal';
import TaskDetailsPopover from '../components/kanban/TaskDetailsPopover';
import ConfirmModal from '../components/common/ConfirmModal';
import ShareBoardModal from '../components/board/ShareBoardModal';
import CreateBoardModal from '../components/board/CreateBoardModal';
import KanbanEmptyBoard from '../components/kanban/KanbanEmptyBoard';
import { useKanbanData } from '../components/kanban/useKanbanData';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../components/common/Avatar';
import { getBoardMembers } from '../api/boardsApi';
import { getUserProfile } from '../api/usersApi';
import { isSystemBoard } from '../api/googleCalendarApi';
import { memberBoardId, memberName, memberRowResolved, memberUserId } from '../components/board/MemberAvatar';
import { createSubtask } from '../api/subtasksApi';

const DONE_STATUSES = ['done', 'completed', 'cancelled'];

export default function KanbanPage() {
  const { user } = useAuth();
  const {
    tasks,
    statuses,
    categories,
    priorities,
    boards,
    activeBoard,
    loading,
    loadTasks,
    loadMetadata,
    reloadBoardMembers,
    addCategory,
    addStatus,
    saveStatusOrder,
    setTaskStatus,
    createTask,
    updateTask,
    deleteTask,
    createBoardForUser,
  } = useTaskContext();

  const {
    filters,
    updateFilter,
    boardStatuses,
    boardCategories,
    filteredTasks,
    error,
    setError,
  } = useKanbanData({
    tasks,
    statuses,
    categories,
    boards,
    activeBoard,
    loadTasks,
    loadMetadata,
  });

  const [modalDate, setModalDate] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [detailsTask, setDetailsTask] = useState(null);
  const [createInitialStatus, setCreateInitialStatus] = useState(null);
  const [metadataModal, setMetadataModal] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [view, setView] = useState('board');
  const [shareOpen, setShareOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState(null);
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [momentumDismissed, setMomentumDismissed] = useState(false);

  const displayName = getDisplayName(user);
  const systemBoard = isSystemBoard(activeBoard);

  // Members and their profiles (avatar, name, email) drive the avatar stack in the header.
  // The backend owns the membership list; when it is empty (or unavailable) the board
  // still belongs to the signed-in user, so that one member is shown.
  const loadMembers = useCallback(async () => {
    if (!activeBoard?.id) {
      setMembers([]);
      setProfiles({});
      return;
    }

    const selfMembers = user?.id
      ? [{ id: 'self', board: activeBoard.id, user: user.id, role: 'owner' }]
      : [];
    const selfProfiles = user?.id
      ? { [user.id]: { id: user.id, email: user.email || '', username: displayName } }
      : {};

    try {
      const list = await getBoardMembers(activeBoard.id);

      // The endpoint returns members of every board of the user, so keep this board's
      // rows only and dedupe by user_id (the profile id, not the membership row id).
      const seen = new Set();
      const unique = list.filter((member) => {
        if (String(memberBoardId(member)) !== String(activeBoard.id)) return false;
        const key = String(memberUserId(member) ?? '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (unique.length === 0) {
        setMembers(selfMembers);
        setProfiles(selfProfiles);
        return;
      }

      setMembers(unique);

      // Member rows already carry email / full_name / avatar_url; only the ones
      // without those fields need the /api/auth/users/{id}/ lookup.
      const resolved = await Promise.all(
        unique.map(async (member) => {
          const key = memberUserId(member);
          if (!key || memberRowResolved(member)) return [key, null];
          return [key, await getUserProfile(key)];
        })
      );
      setProfiles({
        ...selfProfiles,
        ...Object.fromEntries(resolved.filter(([key, profile]) => key && profile)),
      });
    } catch {
      setMembers(selfMembers);
      setProfiles(selfProfiles);
    }
  }, [activeBoard?.id, displayName, user?.email, user?.id]);

  useEffect(() => {
    let cancelled = false;
    loadMembers().catch(() => { if (!cancelled) setMembers([]); });
    return () => { cancelled = true; };
  }, [loadMembers]);

  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const openCreate = (status = null) => {
    setEditingTask(null);
    setCreateInitialStatus(status?.id || null);
    setModalDate(new Date().toISOString().slice(0, 10));
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setModalDate(task.due_date || new Date().toISOString().slice(0, 10));
  };

  const closeModal = () => {
    setModalDate(null);
    setEditingTask(null);
    setCreateInitialStatus(null);
  };

  const saveTask = async (payload) => {
    const { subtasks = [], ...taskPayload } = payload;
    try {
      const saved = editingTask
        ? await updateTask(editingTask.id, taskPayload)
        : await createTask({
          ...(createInitialStatus ? { status_id: createInitialStatus } : {}),
          ...taskPayload,
        });

      const taskId = saved?.id || editingTask?.id;
      if (taskId && subtasks.length > 0) {
        await Promise.all(
          subtasks.map((title, index) => createSubtask({ task: taskId, title, is_done: false, position: index }))
        );
        await loadTasks().catch(() => {});
      }
      closeModal();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeTask = async (task) => {
    setTaskToDelete(task);
  };

  const confirmRemoveTask = async () => {
    try {
      await deleteTask(taskToDelete.id);
      if (detailsTask?.id === taskToDelete.id) setDetailsTask(null);
      setTaskToDelete(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleTaskStatusChange = async (taskId, targetStatus) => {
    try {
      await setTaskStatus(taskId, targetStatus);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleTaskPriorityChange = async (taskId, nextPriority) => {
    try {
      await updateTask(taskId, { priority: nextPriority });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleDuplicateTask = async (taskToDuplicate) => {
    try {
      const currentStatusId = taskToDuplicate.status_id ?? taskToDuplicate.status?.id ?? taskToDuplicate.status;
      const currentCategoryId = taskToDuplicate.category_id ?? taskToDuplicate.category?.id ?? taskToDuplicate.category;
      await createTask({
        title: `${taskToDuplicate.title} (Copy)`,
        description: taskToDuplicate.description || '',
        due_date: taskToDuplicate.due_date || null,
        due_time: taskToDuplicate.due_time || '09:00',
        priority: taskToDuplicate.priority || 'medium',
        status_id: currentStatusId || undefined,
        category_id: currentCategoryId || undefined,
        assignee_id: taskToDuplicate.assignee_id || taskToDuplicate.assignee?.id || null,
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleColumnsOrderChange = async (ordered) => {
    try {
      await saveStatusOrder(ordered);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const handleCreateMetadata = async (formData) => {
    try {
      if (metadataModal === 'category') {
        await addCategory(formData);
      } else {
        await addStatus({
          ...formData,
          position: boardStatuses.length + 1,
          order: boardStatuses.length + 1,
        });
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const assignees = members.map((member) => {
    const key = memberUserId(member);
    return { id: key, name: memberName(profiles[key], member) };
  });

  const quickCreate = async (payload) => {
    await createTask(payload);
  };

  const statusOf = (task) => boardStatuses.find(
    (status) => String(status.id) === String(task.status_id ?? task.status?.id ?? task.status)
  );

  const doneCount = filteredTasks.filter((task) => DONE_STATUSES.includes((statusOf(task)?.name || '').toLowerCase())).length;
  const approvalCount = filteredTasks.filter((task) => (statusOf(task)?.name || '').toLowerCase().includes('approval')).length;
  const activeCount = Math.max(filteredTasks.length - doneCount - approvalCount, 0);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const handleCreateBoard = async (formData) => {
    try {
      await createBoardForUser({ user_id: user?.id, ...formData });
      setCreateBoardOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const hasBoards = Boolean(activeBoard || boards.length > 0);

  return (
    <div className="workspace-page kanban-page">
      {hasBoards ? (
        <>
          <KanbanHeader
            boardName={activeBoard?.name || 'My task board'}
            boardDescription={activeBoard?.description || 'A clearer day starts here. Plan it, delegate it, get it done.'}
            systemBoard={systemBoard}
            members={members}
            profiles={profiles}
            onOpenShare={() => setShareOpen(true)}
            onOpenCategoryModal={() => setMetadataModal('category')}
            onOpenStatusModal={() => setMetadataModal('status')}
            onOpenCreateTask={() => openCreate(boardStatuses[0])}
          />

          <KanbanToolbar
            view={view}
            onViewChange={setView}
            filters={filters}
            onFilterChange={updateFilter}
            statuses={boardStatuses}
            categories={boardCategories}
            priorities={priorities}
          />

          {!momentumDismissed && filteredTasks.length > 0 && (
            <div className="board-momentum">
              <span className="board-momentum-icon" aria-hidden="true">✦</span>
              <div>
                <strong>A little momentum for your {today}</strong>
                <p>
                  I'm working on {activeCount} {activeCount === 1 ? 'task' : 'tasks'}
                  {approvalCount > 0 ? `, and ${approvalCount} ${approvalCount === 1 ? 'is' : 'are'} ready for your approval` : ''}.
                  You've already checked off {doneCount} today.
                </p>
              </div>
              <a className="board-momentum-link" href="/ai-assistant">Let's review →</a>
              <button type="button" className="board-momentum-close" aria-label="Dismiss" onClick={() => setMomentumDismissed(true)}>×</button>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          {view === 'list' ? (
            <div className="task-list">
              <div className="task-list-head"><span>Task</span><span>Status</span><span>Priority</span><span>Due</span></div>
              {filteredTasks.map((task) => {
                const status = statusOf(task);
                return (
                  <button type="button" className="task-list-row" key={task.id} onClick={() => setDetailsTask(task)}>
                    <span className="task-list-title">{task.title}</span>
                    <span className="task-list-status">
                      <i className="status-dot" style={status?.color ? { background: status.color } : undefined} />
                      {status?.name || '—'}
                    </span>
                    <span className={`task-list-priority card-priority priority-${task.priority || 'medium'}`}>{task.priority || 'medium'}</span>
                    <span>{task.due_date || 'No due date'}</span>
                  </button>
                );
              })}
              {filteredTasks.length === 0 && <p className="muted" style={{ padding: '18px' }}>No tasks match the current filters.</p>}
            </div>
          ) : (
            <KanbanBoard
              columns={boardStatuses}
              tasks={filteredTasks}
              categories={boardCategories}
              initials={initials}
              loading={loading}
              onTaskStatusChange={handleTaskStatusChange}
              onTaskPriorityChange={handleTaskPriorityChange}
              onColumnsOrderChange={handleColumnsOrderChange}
              onOpenCreate={openCreate}
              onOpenEdit={openEdit}
              onRemoveTask={removeTask}
              onOpenDetails={setDetailsTask}
              onDuplicateTask={handleDuplicateTask}
              quickAddStatus={quickAddStatus}
              onOpenQuickAdd={setQuickAddStatus}
              onCloseQuickAdd={() => setQuickAddStatus(null)}
              onQuickCreate={quickCreate}
              onOpenFullTask={(status) => openCreate(status)}
            />
          )}

          <footer className="board-footer">
            ✓ All changes saved{' '}
            <span>· {filteredTasks.length} tasks across {boardStatuses.length} stages</span>
            <strong>✦ Handled by Avenor · Drag tasks to move them</strong>
          </footer>
        </>
      ) : (
        <KanbanEmptyBoard onOpenCreateBoard={() => setCreateBoardOpen(true)} />
      )}

      {createBoardOpen && (
        <CreateBoardModal
          onClose={() => setCreateBoardOpen(false)}
          onSubmit={handleCreateBoard}
        />
      )}

      {modalDate && (
        <TaskForm
          date={modalDate}
          task={
            editingTask
              ? editingTask
              : createInitialStatus
              ? { status_id: createInitialStatus }
              : null
          }
          statuses={boardStatuses}
          categories={boardCategories}
          assignees={assignees}
          onClose={closeModal}
          onSubmit={saveTask}
        />
      )}

      {detailsTask && (
        <TaskDetailsPopover
          task={detailsTask}
          statuses={boardStatuses}
          categories={boardCategories}
          onClose={() => setDetailsTask(null)}
          onEdit={(task) => {
            setDetailsTask(null);
            openEdit(task);
          }}
          onDelete={removeTask}
          onStatusChange={handleTaskStatusChange}
        />
      )}

      {shareOpen && (
        <ShareBoardModal board={activeBoard} onClose={() => setShareOpen(false)} onMembersChanged={() => { loadMembers(); reloadBoardMembers(); }} />
      )}

      <MetadataModal
        type={metadataModal}
        onClose={() => setMetadataModal(null)}
        onSubmit={handleCreateMetadata}
      />

      {taskToDelete && (
        <ConfirmModal
          title="Delete task?"
          message={`Delete "${taskToDelete.title}"?`}
          onClose={() => setTaskToDelete(null)}
          onConfirm={confirmRemoveTask}
        />
      )}
    </div>
  );
}
