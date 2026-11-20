import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { UilCalendarAlt, UilPlus, UilWallet, UilWindowSection } from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import { useTaskContext } from '../../context/TaskContext';
import { getDisplayName } from '../common/Avatar';
import UserMenu from './UserMenu';
import CreateBoardModal from '../board/CreateBoardModal';
import logo from '../../assets/Logo.svg';

const items = [
  { to: '/overview', icon: 'overview', label: 'Overview' },
  { to: '/ai-assistant', icon: 'assistant', label: 'AI assistant' },
  { to: '/kanban', Icon: UilWindowSection, label: 'Task board', countsTasks: true },
  { to: '/planner?view=calendar', Icon: UilCalendarAlt, label: 'Calendar', view: 'calendar' },
  { to: '/budget', Icon: UilWallet, label: 'Budget' },
  { to: '/automations', icon: 'automations', label: 'Automations' },
  { to: '/knowledge', icon: 'knowledge', label: 'Knowledge' },
];

export default function Header({ collapsed = false }) {
  const { isAuthenticated, user } = useAuth();
  const { boards, activeBoard, setActiveBoard, tasks, createBoardForUser } = useTaskContext();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = getDisplayName(user);
  const [boardModal, setBoardModal] = useState(false);

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
          <div className="workspace-switcher">
            <span className="workspace-icon">вЊ‚</span>
            <span><small>Personal space of {displayName}</small><strong>{activeBoard?.name || 'Select board'}</strong></span>
            <button className="workspace-chevron" aria-label="Select board">вЊ„</button>
            <select className="board-selector" value={activeBoard?.id || ''} onChange={(event) => {
              const board = boards.find((item) => String(item.id) === event.target.value);
              if (board) {
                setActiveBoard(board);
                navigate('/kanban');
              }
            }} aria-label="Select board">
              {!boards.length && <option value="">No boards</option>}
              {boards.map((board) => <option value={board.id} key={board.id}>{board.name}</option>)}
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
            {boards.map((board, index) => <button className={`sidebar-board${String(board.id) === String(activeBoard?.id) ? ' active' : ''}`} onClick={() => { setActiveBoard(board); navigate('/kanban'); }} key={board.id}><i className={`board-dot ${['purple', 'blue', 'green'][index % 3]}`} />{board.name}</button>)}
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
