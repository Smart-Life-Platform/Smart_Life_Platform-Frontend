import { useState } from 'react';
import { UilPlus, UilShare } from '@iconscout/react-unicons';
import { MemberAvatars } from '../board/MemberAvatar';

export default function KanbanHeader({
  boardName = 'My task board',
  boardDescription = 'A clearer day starts here. Plan it, delegate it, get it done.',
  systemBoard = false,
  canManage = true,
  members = [],
  profiles = {},
  onOpenShare,
  onOpenCreateTask,
  onOpenCategoryModal,
  onOpenStatusModal,
  onOpenColumnModal,
  onEditBoard,
  onDuplicateBoard,
  onOpenBoardSettings,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const run = (action) => {
    setMenuOpen(false);
    action?.();
  };

  return (
    <section className="board-heading">
      <div className="board-heading-copy">
        <h1>{boardName}</h1>
        <p>{boardDescription}</p>
      </div>

      <div className="board-heading-actions">
        {!systemBoard && <MemberAvatars members={members} profiles={profiles} />}

        {!systemBoard && (
          <button type="button" className="ghost-button" onClick={onOpenShare}>
            <UilShare size="15" /> Share board
          </button>
        )}

        <button
          type="button"
          className="new-task-button"
          onClick={onOpenCreateTask}
          disabled={!canManage}
          title={canManage ? undefined : 'View-only access'}
        >
          <UilPlus size="16" /> New task
        </button>

        <div className="board-menu">
          <button
            type="button"
            className="icon-button"
            aria-label="Board menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            •••
          </button>
          {menuOpen && (
            <div className="board-menu-list" role="menu">
              <button type="button" onClick={() => run(onEditBoard)} disabled={!canManage}>Edit board</button>
              <button type="button" onClick={() => run(onDuplicateBoard)} disabled={!canManage}>Duplicate board</button>
              <button type="button" onClick={() => run(onOpenBoardSettings)}>Board settings</button>
              <div className="board-menu-separator" aria-hidden="true" />
              <button type="button" onClick={() => run(onOpenColumnModal || onOpenStatusModal)} disabled={!canManage}>Add column</button>
              <button type="button" onClick={() => run(onOpenStatusModal)} disabled={!canManage}>Add status</button>
              <button type="button" onClick={() => run(onOpenCategoryModal)} disabled={!canManage}>Add category</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
