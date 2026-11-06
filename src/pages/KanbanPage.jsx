import { useState } from 'react';
import TaskForm from '../components/tasks/TaskForm';
import KanbanBoard from '../components/kanban/KanbanBoard';
import KanbanHeader from '../components/kanban/KanbanHeader';
import KanbanToolbar from '../components/kanban/KanbanToolbar';
import MetadataModal from '../components/kanban/MetadataModal';
import TaskDetailsPopover from '../components/kanban/TaskDetailsPopover';
import { useKanbanData } from '../components/kanban/useKanbanData';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { getDisplayName } from '../components/common/Avatar';

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
    addCategory,
    addStatus,
    saveStatusOrder,
    setTaskStatus,
    createTask,
    updateTask,
    deleteTask,
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

  const displayName = getDisplayName(user);
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
    try {
      if (editingTask) {
        await updateTask(editingTask.id, payload);
      } else {
        await createTask({
          ...(createInitialStatus ? { status_id: createInitialStatus } : {}),
          ...payload,
        });
      }
      closeModal();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const removeTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      if (detailsTask?.id === task.id) setDetailsTask(null);
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

  return (
    <div className="workspace-page kanban-page">
      <KanbanHeader
        boardName={activeBoard?.name}
        boardDescription={activeBoard?.description}
        onOpenCategoryModal={() => setMetadataModal('category')}
        onOpenStatusModal={() => setMetadataModal('status')}
        onOpenCreateTask={() => openCreate(boardStatuses[0])}
      />

      <KanbanToolbar
        filters={filters}
        onFilterChange={updateFilter}
        statuses={boardStatuses}
        categories={boardCategories}
        priorities={priorities}
      />

      {error && <p className="form-error">{error}</p>}

      <KanbanBoard
        columns={boardStatuses}
        tasks={filteredTasks}
        categories={boardCategories}
        initials={initials}
        loading={loading}
        onTaskStatusChange={handleTaskStatusChange}
        onColumnsOrderChange={handleColumnsOrderChange}
        onOpenCreate={openCreate}
        onOpenEdit={openEdit}
        onRemoveTask={removeTask}
        onOpenDetails={setDetailsTask}
      />

      <footer className="board-footer">
        ⌁ All changes saved{' '}
        <span>
          · {filteredTasks.length} tasks across {boardStatuses.length} stages
        </span>
        <strong>✣ Handled by Avenor · Drag tasks to move them</strong>
      </footer>

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

      <MetadataModal
        type={metadataModal}
        onClose={() => setMetadataModal(null)}
        onSubmit={handleCreateMetadata}
      />
    </div>
  );
}
