import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  UilApps,
  UilBookOpen,
  UilRobot,
  UilCalendarAlt,
  UilColumns,
  UilObjectGroup,
  UilSetting,
  UilWallet,
  UilPlus,
  UilTimes,
} from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import { useTaskContext } from '../../context/TaskContext';
import { getDisplayName } from '../common/Avatar';
import UserMenu from './UserMenu';
import logo from '../../assets/Logo.svg';

const items = [
  { to: '/overview', Icon: UilApps, label: 'Overview' },
  { to: '/ai-assistant', Icon: UilRobot, label: 'AI assistant' },
  { to: '/kanban', Icon: UilColumns, label: 'Task board', countsTasks: true },
  { to: '/planner?view=calendar', Icon: UilCalendarAlt, label: 'Calendar', view: 'calendar' },
  { to: '/budget', Icon: UilWallet, label: 'Budget' },
  { to: '/automations', Icon: UilObjectGroup, label: 'Automations' },
  { to: '/knowledge', Icon: UilBookOpen, label: 'Knowledge' },
];

export default function Header({ collapsed = false }) {
  const { isAuthenticated, user } = useAuth();
  const { boards, activeBoard, setActiveBoard, tasks, createBoardForUser } = useTaskContext();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = getDisplayName(user);
  const [boardModal, setBoardModal] = useState(false);
  const [boardForm, setBoardForm] = useState({ name: '', description: '', icon: '', color: '#6d5ce7' });
  const [boardError, setBoardError] = useState('');

  const pathname = location.pathname;
  const onCalendar = pathname === '/planner' && location.search.includes('view=calendar');

  function isActive(item) {
    if (item.view === 'calendar') return onCalendar;
    if (pathname !== item.to.split('?')[0]) return false;
    return !onCalendar;
  }

  async function submitBoard(event) {
    event.preventDefault();
    setBoardError('');
    try {
      await createBoardForUser({ user_id: user?.id, ...boardForm });
      setBoardForm({ name: '', description: '', icon: '', color: '#6d5ce7' });
      setBoardModal(false);
      navigate('/kanban');
    } catch (error) {
      setBoardError(error.message);
    }
  }

  return (
    <aside className={`app-sidebar${!isAuthenticated ? ' auth-sidebar' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}>
      <button className="brand brand-button" onClick={() => navigate(isAuthenticated ? '/kanban' : '/login')}>
        <img src={logo} alt="Avenor" />
      </button>
      {isAuthenticated && (
        <>
          <div className="workspace-switcher">
            <span className="workspace-icon">⌂</span>
            <span><small>Personal space of {displayName}</small><strong>{activeBoard?.name || 'Select board'}</strong></span>
            <button className="workspace-chevron" aria-label="Select board">⌄</button>
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
                <item.Icon size="17" />
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
          <NavLink className="sidebar-settings" to="/settings"><UilSetting size="16" />Settings &amp; help</NavLink>
          <div className="sidebar-user"><UserMenu showDetails /></div>
        </>
      )}
      {boardModal && <div className="modal-backdrop" onMouseDown={() => setBoardModal(false)}>
        <form className="task-modal board-modal" onSubmit={submitBoard} onMouseDown={(event) => event.stopPropagation()}>
          <div className="modal-heading"><h2>New board</h2><button type="button" className="close-button" onClick={() => setBoardModal(false)}><UilTimes size="20" /></button></div>
          <label>Name<input value={boardForm.name} onChange={(event) => setBoardForm({ ...boardForm, name: event.target.value })} required /></label>
          <label>Description<textarea value={boardForm.description} onChange={(event) => setBoardForm({ ...boardForm, description: event.target.value })} /></label>
          <div className="form-grid"><label>Icon<input value={boardForm.icon} onChange={(event) => setBoardForm({ ...boardForm, icon: event.target.value })} /></label><label>Color<input type="color" value={boardForm.color} onChange={(event) => setBoardForm({ ...boardForm, color: event.target.value })} /></label></div>
          {boardError && <p className="form-error">{boardError}</p>}
          <button className="primary-button full-width" type="submit">Create board</button>
        </form>
      </div>}
    </aside>
  );
}
