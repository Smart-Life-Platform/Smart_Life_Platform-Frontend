import { UilPlus, UilWindowSection } from '@iconscout/react-unicons';

export default function KanbanEmptyBoard({ onOpenCreateBoard }) {
  return (
    <div className="kanban-empty-state">
      <div className="kanban-empty-icon-wrap">
        <UilWindowSection size="48" />
      </div>
      <h2>You don't have any boards yet</h2>
      <p>Create your first task board to organize your work and track progress.</p>
      <button type="button" className="primary-button kanban-create-board-btn" onClick={onOpenCreateBoard}>
        <UilPlus size="16" /> Create board
      </button>
    </div>
  );
}
