import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { UilChart, UilCreateDashboard, UilPlus, UilSchedule, UilSignout, UilUser } from '@iconscout/react-unicons';
import { useAuth } from '../../context/AuthContext';
import UserMenu from './UserMenu';

const items = [
  ['planner', UilSchedule, 'Planner'],
  ['budget', UilCreateDashboard, 'Budget'],
  ['profile', UilUser, 'My profile'],
  ['statistics', UilChart, 'Statistics'],
];

export default function Header({ onCreate }) {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="topbar">
      <button className="brand brand-button" onClick={() => navigate(isAuthenticated ? '/planner' : '/login')}>
        <span className="brand-mark small">sl</span><strong>smart life</strong>
      </button>
      {isAuthenticated && <nav>{items.map(([path, Icon, label]) => <NavLink key={path} to={`/${path}`} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size="17" /><span>{label}</span></NavLink>)}</nav>}
      <div className="user-actions">
        {isAuthenticated ? <>{location.pathname === '/planner' && <button className="create-button" onClick={onCreate}><UilPlus size="17" /> Create</button>}<UserMenu /></> : <><NavLink className="header-auth-link" to="/login">Sign in</NavLink><NavLink className="header-auth-button" to="/register">Create account</NavLink></>}
      </div>
    </header>
  );
}
