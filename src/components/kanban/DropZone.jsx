import { useDroppable } from '@dnd-kit/core';

export default function DropZone({ status, position = 'bottom', label = 'Drop task here' }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `dropzone-${status.id}-${position}`,
    data: {
      type: 'dropzone',
      status,
      position,
    },
  });

  const isEmpty = position === 'empty';

  return (
    <div
      ref={setNodeRef}
      className={`kanban-dropzone ${isEmpty ? 'empty-column' : 'indicator'}${isOver ? ' is-over' : ''}`}
    >
      {isEmpty && <span>{isOver ? 'Release to drop here' : label}</span>}
    </div>
  );
}

