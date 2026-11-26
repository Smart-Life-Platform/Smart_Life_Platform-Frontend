import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { UilCalendarAlt, UilHome, UilPlus, UilSort, UilWallet } from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import { useTaskContext } from '../../context/TaskContext';
import UserMenu from './UserMenu';
import CreateBoardModal from '../board/CreateBoardModal';
import { useBoardSpaces } from '../../hooks/useBoardSpaces';
import { spaceTitle } from '../../utils/boardSpace';
import logo from '../../assets/Logo.svg';

const items = [
  { to: '/overview', icon: 'overview', label: 'Overview' },
  { to: '/ai-assistant', icon: 'assistant', label: 'AI assistant' },
  { to: '/kanban', icon: 'task-board', label: 'Task board', countsTasks: true },
  { to: '/planner?view=calendar', Icon: UilCalendarAlt, label: 'Calendar', view: 'calendar' },
  { to: '/budget', Icon: UilWallet, label: 'Budget' },
  { to: '/automations', icon: 'automations', label: 'Automations' },
  { to: '/knowledge', icon: 'knowledge', label: 'Knowledge' },
];

export default function Header({ collapsed = false }) {
  const { isAuthenticated, user } = useAuth();
  const { boards, activeBoard, setActiveBoard, tasks, createBoardForUser } = useTaskContext();
  // Personal / public / other space of the selected board, plus every board grouped
  // the same way for the dropdown.
  const { groups, activeSpace, spaceFor } = useBoardSpaces();
  const navigate = useNavigate();
  const location = useLocation();
  const [boardModal, setBoardModal] = useState(false);

  const boardLabel = activeBoard?.name || (boards.length ? 'Select board' : 'No boards yet');

  function selectBoard(event) {
    const board = boards.find((item) => String(item.id) === event.target.value);
    if (!board) return;
    setActiveBoard(board);
    navigate('/kanban');
  }

  const pathname = location.pathname;
  const onCalendar = pathname === '/planner' && location.search.includes('view=calendar');

  // Exactly one entry may be active: the previous version highlighted "Task board"
  // on every page that was not the calendar.
  function isActive(item) {
    if (item.view === 'calendar') return onCalendar;
    if (pathname !== item.to.split('?')[0]) return false;
    return !onCalendar;
  }

  async function handleCreateBoard(formData) {
    await createBoardForUser({ user_id: user?.id, ...formData });
    navigate('/kanban');
  }

  return (
    <aside className={`app-sidebar${!isAuthenticated ? ' auth-sidebar' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}>
      <img src={logo} style={{ width: '140px', height: 'auto' }} alt="Avenor" />


      {isAuthenticated && (
        <>
          {/* The label follows the selected board: a board of the user's own with no
              other members is a personal space, the same board once people are invited
              is a public space, and a board owned by somebody else is an "other" space. */}
          <div className="workspace-switcher" title={spaceTitle(activeSpace, activeBoard)}>
            <span className="workspace-icon" aria-hidden="true"><UilHome size="22" /></span>
            <span className="workspace-switcher-copy">
              <small className="workspace-switcher-space">{activeSpace.label}</small>
              <strong className="workspace-switcher-board">{boardLabel}</strong>
            </span>
            <span className="workspace-chevron" aria-hidden="true"><UilSort size="18" /></span>
            <select
              className="board-selector"
              value={activeBoard ? String(activeBoard.id) : ''}
              onChange={selectBoard}
              aria-label={`Select board (${activeSpace.label})`}
            >
              {!boards.length && <option value="">No boards yet</option>}
              {groups.map((group) => (
                <optgroup label={group.label} key={group.kind}>
                  {group.boards.map(({ board }) => <option value={String(board.id)} key={board.id}>{board.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <nav className="sidebar-nav" aria-label="Main navigation">
            {items.map((item) => (
              <NavLink key={item.label} to={item.to} className={`nav-link${isActive(item) ? ' active' : ''}`}>
                {item.icon
                  ? <span className={`nav-icon icon-${item.icon}`} aria-hidden="true" />
                  : <item.Icon />}
                <span>{item.label}</span>
                {item.countsTasks && <b className="nav-count">{tasks.length}</b>}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-section-label">MY BOARDS <button aria-label="Add board" onClick={() => setBoardModal(true)}><UilPlus size="15" /></button></div>
          <nav className="sidebar-boards">
            {boards.map((board, index) => <button className={`sidebar-board${String(board.id) === String(activeBoard?.id) ? ' active' : ''}`} title={spaceTitle(spaceFor(board), board)} onClick={() => { setActiveBoard(board); navigate('/kanban'); }} key={board.id}><i className={`board-dot ${['purple', 'blue', 'green'][index % 3]}`} />{board.name}</button>)}
          </nav>
          <div className="sidebar-spacer" />
          <NavLink className="sidebar-settings" to="/settings">
            <span className="nav-icon icon-settings" aria-hidden="true" />Settings &amp; help
          </NavLink>
          <div className="sidebar-user"><UserMenu showDetails /></div>
        </>
      )}
      {boardModal && (
        <CreateBoardModal
          onClose={() => setBoardModal(false)}
          onSubmit={handleCreateBoard}
        />
      )}
    </aside>
  );
}
