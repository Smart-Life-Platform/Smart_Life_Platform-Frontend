import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UilCheck, UilTimes, UilUser } from '@iconscout/react-unicons';
import { MemberAvatar } from '../board/MemberAvatar';

const VIEWPORT_MARGIN = 8;

/**
 * Assignee picker shown when the avatar in a card footer is clicked.
 * The first row clears the assignment, so a task can go back to "nobody".
 *
 * The panel is portalled to <body> and positioned from the button rect: the board
 * scrolls horizontally on narrow screens (`.board-columns { overflow-x: auto }`),
 * and an absolutely positioned panel would be clipped by it.
 */
export default function AssigneeMenu({ anchorRef, assignees = [], value, onSelect, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);
  const current = value === null || value === undefined || value === '' ? null : String(value);

  useLayoutEffect(() => {
    const anchor = anchorRef?.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const button = anchor.getBoundingClientRect();
    const panel = menu.getBoundingClientRect();
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, button.right - panel.width),
      window.innerWidth - panel.width - VIEWPORT_MARGIN
    );
    const above = button.top - panel.height - 6;
    const top = above >= VIEWPORT_MARGIN
      ? above
      : Math.min(button.bottom + 6, window.innerHeight - panel.height - VIEWPORT_MARGIN);

    setPosition({ top, left });
  }, [anchorRef]);

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target;
      if (menuRef.current?.contains(target)) return;
      // The trigger keeps its own toggle handler, otherwise the menu would close and
      // immediately reopen on the same click.
      if (anchorRef?.current?.contains(target)) return;
      onClose?.();
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    function handleViewportChange(event) {
      if (event?.target && menuRef.current?.contains(event.target)) return;
      onClose?.();
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="assignee-popup"
      role="menu"
      aria-label="Assign task"
      style={position
        ? { position: 'fixed', top: position.top, left: position.left, right: 'auto', bottom: 'auto' }
        : { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="assignee-popup-header">
        <span className="assignee-popup-title">Assign task</span>
        <button type="button" className="assignee-popup-close" onClick={onClose} aria-label="Close assignee menu">
          <UilTimes size="14" />
        </button>
      </div>

      <ul className="assignee-popup-list" role="none">
        <li role="none">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={current === null}
            className={`assignee-option${current === null ? ' is-selected' : ''}`}
            onClick={() => onSelect?.(null)}
          >
            <span className="assignee-option-avatar is-empty" aria-hidden="true"><UilUser size="12" /></span>
            <span className="assignee-option-name">Unassigned</span>
            {current === null && <span className="assignee-option-check"><UilCheck size="14" /></span>}
          </button>
        </li>

        {assignees.map((member) => {
          const selected = current !== null && String(member.id) === current;
          return (
            <li key={member.id} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                className={`assignee-option${selected ? ' is-selected' : ''}`}
                onClick={() => onSelect?.(member.id)}
              >
                <MemberAvatar profile={member.profile} member={member.member} name={member.name} size={22} />
                <span className="assignee-option-name">{member.name}</span>
                {selected && <span className="assignee-option-check"><UilCheck size="14" /></span>}
              </button>
            </li>
          );
        })}
      </ul>

      {!assignees.length && <p className="assignee-popup-empty">No one else is on this board yet.</p>}
    </div>,
    document.body
  );
}
