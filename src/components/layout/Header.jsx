import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  UilApps,
  UilBars,
  UilCalendarAlt,
  UilCreateDashboard,
  UilFileAlt,
  UilSetting,
  UilShare,
  UilRobot,
  UilPlus,
  UilTimes,
} from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import { useTaskContext } from '../../context/TaskContext';
import { getDisplayName } from '../common/Avatar';
import UserMenu from './UserMenu';
import logo from '../../assets/Logo.svg';

const items = [
  ['/planner', UilApps, 'Overview'],
  ['/ai-assistant', UilRobot, 'AI assistant'],
  ['/kanban', UilBars, 'Task board', 'board'],
  ['/planner?view=calendar', UilCalendarAlt, 'Calendar', 'calendar'],
  ['/budget', UilCreateDashboard, 'Budget'],
  ['/automations', UilShare, 'Automations'],
  ['/knowledge', UilFileAlt, 'Knowledge'],
];

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const { boards, activeBoard, setActiveBoard, tasks, createBoardForUser } = useTaskContext();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = getDisplayName(user);
  const [boardModal, setBoardModal] = useState(false);
  const [boardForm, setBoardForm] = useState({ name: '', description: '', icon: '', color: '#6d5ce7' });
  const [boardError, setBoardError] = useState('');

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
    <aside className={`app-sidebar${!isAuthenticated ? ' auth-sidebar' : ''}`}>
      <button className="brand brand-button" onClick={() => navigate(isAuthenticated ? '/planner' : '/login')}>
        <img src={logo} alt="Avenor" />
      </button>
      {isAuthenticated && (
        <>
          <div className="workspace-switcher">
            <span className="workspace-icon">⌂</span>
            <span><small>Personal space</small><strong>{activeBoard?.name || 'Select board'}</strong></span>
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
            {items.map(([path, Icon, label, view]) => (
              <NavLink
                key={`${label}-${view || ''}`}
                to={path}
                className={() => `nav-link${(view === 'calendar' ? location.search.includes('calendar') : view === 'board' ? !location.search.includes('calendar') : location.pathname === path && !view) ? ' active' : ''}`}
              >
                <Icon size="17" /><span>{label}</span>{label === 'Task board' && <b className="nav-count">{tasks.length}</b>}
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
