import { UilPlus } from '@iconscout/react-unicons';

export default function KanbanHeader({
  boardName = 'My task board',
  boardDescription = 'Personal workspace board',
  onOpenCategoryModal,
  onOpenStatusModal,
  onOpenCreateTask,
}) {
  return (
    <section className="board-heading">
      <div>
        <h1>{boardName}</h1>
        <p>{boardDescription}</p>
      </div>
      <div className="board-heading-actions">
        <button
          type="button"
          className="metadata-button"
          onClick={onOpenCategoryModal}
        >
          Category <UilPlus size="14" />
        </button>
        <button
          type="button"
          className="metadata-button"
          onClick={onOpenStatusModal}
        >
          Status <UilPlus size="14" />
        </button>
        <button
          type="button"
          className="new-task-button"
          onClick={onOpenCreateTask}
        >
          <UilPlus size="16" /> New task
        </button>
      </div>
    </section>
  );
}

