import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';

export default function KanbanBoard({
  columns = [],
  tasks = [],
  categories = [],
  initials = 'U',
  loading = false,
  onTaskStatusChange,
  onColumnsOrderChange,
  onOpenCreate,
  onOpenEdit,
  onRemoveTask,
  onOpenDetails,
}) {
  const [dragged, setDragged] = useState(null);
  const [liveColumns, setLiveColumns] = useState(columns);

  useEffect(() => {
    setLiveColumns(columns);
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const collisionDetectionStrategy = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  }, []);

  const handleDragStart = ({ active }) => {
    setDragged(active.data.current || null);
  };

  const handleDragCancel = () => {
    setDragged(null);
    setLiveColumns(columns);
  };

  const handleDragOver = ({ active, over }) => {
    if (!over) return;
    const activeData = active.data?.current;

    // Live column swapping when dragging a column
    if (activeData?.type === 'column') {
      const overData = over.data?.current;
      let targetStatus = null;

      if (overData?.type === 'column' || overData?.type === 'dropzone') {
        targetStatus = overData.status;
      } else if (overData?.type === 'task') {
        const overStatusId = overData.statusId ?? overData.task?.status_id;
        targetStatus = liveColumns.find((c) => String(c.id) === String(overStatusId));
      } else if (typeof over.id === 'string') {
        const targetId = over.id.replace(/^(column|status|dropzone)-/, '').split('-')[0];
        targetStatus = liveColumns.find((c) => String(c.id) === String(targetId));
      }

      if (targetStatus && String(activeData.status.id) !== String(targetStatus.id)) {
        const fromIndex = liveColumns.findIndex((c) => String(c.id) === String(activeData.status.id));
        const toIndex = liveColumns.findIndex((c) => String(c.id) === String(targetStatus.id));
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
          const reordered = [...liveColumns];
          const [moved] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, moved);
          setLiveColumns(reordered);
        }
      }
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    const currentDragged = active?.data?.current;
    setDragged(null);

    if (!currentDragged) return;

    // 1. Task drag and drop
    if (currentDragged.type === 'task') {
      if (!over) return;
      const overData = over.data?.current;
      const task = currentDragged.task;
      let targetStatus = null;

      if (overData?.type === 'column' || overData?.type === 'dropzone') {
        targetStatus = overData.status;
      } else if (overData?.type === 'task') {
        const overTask = overData.task;
        const overStatusId =
          overData.statusId ??
          overTask?.status_id ??
          overTask?.status?.id ??
          overTask?.status;
        targetStatus =
          liveColumns.find((s) => String(s.id) === String(overStatusId)) ||
          liveColumns.find(
            (s) => (s.name || '').toLowerCase() === (overTask?.status_name || '').toLowerCase()
          );
      } else if (typeof over.id === 'string') {
        const targetId = over.id.replace(/^(column|status|dropzone)-/, '').split('-')[0];
        targetStatus = liveColumns.find((c) => String(c.id) === String(targetId));
      }

      if (!targetStatus) return;

      const currentStatusId = task.status_id ?? task.status?.id ?? task.status;
      const currentStatusName =
        task.status_name ||
        liveColumns.find((s) => String(s.id) === String(currentStatusId))?.name ||
        '';

      const isSameStatus =
        String(currentStatusId) === String(targetStatus.id) ||
        (currentStatusName && currentStatusName.toLowerCase() === targetStatus.name.toLowerCase());

      if (isSameStatus) return;

      onTaskStatusChange?.(task.id, targetStatus, task);
      return;
    }

    // 2. Column drag and drop: save final reordered columns
    if (currentDragged.type === 'column') {
      const hasChanged = liveColumns.some(
        (col, idx) => String(col.id) !== String(columns[idx]?.id)
      );

      if (hasChanged) {
        onColumnsOrderChange?.(liveColumns);
        return;
      }

      // If not swapped yet during dragOver, swap now
      if (over) {
        const overData = over.data?.current;
        let targetStatus = null;

        if (overData?.type === 'column' || overData?.type === 'dropzone') {
          targetStatus = overData.status;
        } else if (typeof over.id === 'string') {
          const targetId = over.id.replace(/^(column|status|dropzone)-/, '').split('-')[0];
          targetStatus = liveColumns.find((c) => String(c.id) === String(targetId));
        }

        if (targetStatus && String(currentDragged.status.id) !== String(targetStatus.id)) {
          const fromIndex = liveColumns.findIndex(
            (c) => String(c.id) === String(currentDragged.status.id)
          );
          const toIndex = liveColumns.findIndex(
            (c) => String(c.id) === String(targetStatus.id)
          );

          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            const reordered = [...liveColumns];
            const [moved] = reordered.splice(fromIndex, 1);
            reordered.splice(toIndex, 0, moved);
            setLiveColumns(reordered);
            onColumnsOrderChange?.(reordered);
          }
        }
      }
    }
  };

  const statusName = (task) =>
    task.status_name ||
    liveColumns.find((item) => String(item.id) === String(task.status_id ?? task.status?.id ?? task.status))?.name ||
    task.status?.name ||
    '';

  const tasksForColumn = (status) =>
    tasks.filter((task) => {
      const taskId = String(task.status_id ?? task.status?.id ?? task.status ?? '');
      if (taskId === String(status.id)) return true;
      const name = statusName(task).toLowerCase();
      return name && name === status.name.toLowerCase();
    });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      <div className="board-columns" id="board">
        {!liveColumns.length && (
          <p className="muted board-empty">
            Немає статусів для цієї дошки. Створіть статус через кнопку Status.
          </p>
        )}

        {liveColumns.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={tasksForColumn(status)}
            categories={categories}
            statuses={liveColumns}
            initials={initials}
            loading={loading}
            onOpenCreate={onOpenCreate}
            onOpenEdit={onOpenEdit}
            onRemoveTask={onRemoveTask}
            onOpenDetails={onOpenDetails}
            isDraggingAny={Boolean(dragged)}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {dragged?.type === 'task' ? (
          <div style={{ width: '220px' }}>
            <TaskCard
              task={dragged.task}
              categories={categories}
              statuses={liveColumns}
              initials={initials}
              isOverlay
            />
          </div>
        ) : dragged?.type === 'column' ? (
          <div
            className="board-column drag-over board-drag-overlay-column"
            style={{
              width: '240px',
              minHeight: '140px',
              padding: '10px',
            }}
          >
            <div className="column-heading">
              <div className="column-drag-handle column-header-title">
                <span className="column-grip-icon" aria-hidden="true">⋮⋮</span>
                <span
                  className="status-dot"
                  style={dragged.status.color ? { background: dragged.status.color } : undefined}
                />
                <strong>{dragged.status.name}</strong>
                <b>{tasksForColumn(dragged.status).length}</b>
              </div>
            </div>
            <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--color-secondary)', textAlign: 'center' }}>
              Moving status <strong>{dragged.status.name}</strong>…
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
