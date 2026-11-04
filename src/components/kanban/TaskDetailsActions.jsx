import { UilEditAlt, UilTrashAlt } from '@iconscout/react-unicons';

export default function TaskDetailsActions({ onEdit, onDelete }) {
  return (
    <div className="task-popover-actions">
      <button
        type="button"
        className="danger"
        onClick={onDelete}
      >
        <UilTrashAlt size="14" /> Delete
      </button>
      <button
        type="button"
        className="primary"
        onClick={onEdit}
      >
        <UilEditAlt size="14" /> Edit task
      </button>
    </div>
  );
}

