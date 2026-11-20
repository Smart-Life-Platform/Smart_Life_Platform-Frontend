import { useState } from 'react';
import { UilPlus, UilShare } from '@iconscout/react-unicons';
import { MemberAvatars } from '../board/MemberAvatar';

export default function KanbanHeader({
  boardName = 'My task board',
  boardDescription = 'A clearer day starts here. Plan it, delegate it, get it done.',
  systemBoard = false,
  members = [],
  profiles = {},
  onOpenShare,
  onOpenCreateTask,
  onOpenCategoryModal,
  onOpenStatusModal,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="board-heading">
      <div className="board-heading-copy">
        <h1>{boardName}<span className="board-star" aria-hidden="true">☆</span></h1>
        <p>{boardDescription}</p>
      </div>

      <div className="board-heading-actions">
        {!systemBoard && <MemberAvatars members={members} profiles={profiles} />}

        {!systemBoard && (
          <button type="button" className="ghost-button" onClick={onOpenShare}>
            <UilShare size="15" /> Share board
          </button>
        )}

        <button type="button" className="new-task-button" onClick={onOpenCreateTask}>
          <UilPlus size="16" /> New task
        </button>

        <div className="board-menu">
          <button
            type="button"
            className="icon-button"
            aria-label="Board settings"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            •••
          </button>
          {menuOpen && (
            <div className="board-menu-list" role="menu">
              <button type="button" onClick={() => { setMenuOpen(false); onOpenCategoryModal?.(); }}>Add category</button>
              {!systemBoard && (
                <button type="button" onClick={() => { setMenuOpen(false); onOpenStatusModal?.(); }}>Add status</button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
