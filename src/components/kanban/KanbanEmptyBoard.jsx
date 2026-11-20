import { UilPlus, UilWindowSection } from '@iconscout/react-unicons';

export default function KanbanEmptyBoard({ onOpenCreateBoard }) {
  return (
    <div className="kanban-empty-state">
      <div className="kanban-empty-icon-wrap">
        <UilWindowSection size="48" />
      </div>
      <h2>У вас ще немає дошок</h2>
      <p>Створіть свою першу дошку задач, щоб організувати роботу та відстежувати прогрес.</p>
      <button type="button" className="primary-button kanban-create-board-btn" onClick={onOpenCreateBoard}>
        <UilPlus size="16" /> Створити дошку
      </button>
    </div>
  );
}

