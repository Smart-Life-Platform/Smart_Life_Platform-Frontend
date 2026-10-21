import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const items = [['planner', '▦', 'Planner'], ['budget', '◒', 'Budget'], ['profile', '♙', 'My profile'], ['statistics', '◔', 'Statistics']];

export default function Header({ onCreate }) {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function logout() {
    await signOut();
    navigate('/login');
  }

  return (
    <header className="topbar">
      <button className="brand brand-button" onClick={() => navigate(isAuthenticated ? '/planner' : '/login')}>
        <strong>smart life</strong>
      </button>
      {isAuthenticated && (
        <nav>
          {items.map(([path, icon, label]) => (
            <NavLink key={path} to={`/${path}`} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
      )}
      <div className="user-actions">
        {isAuthenticated ? (
          <>
            {location.pathname === '/planner' && <button className="create-button" onClick={onCreate}>+ Create <span>⌄</span></button>}
            <button className="avatar" title="Sign out" onClick={logout}>{(user?.email || 'U').slice(0, 1).toUpperCase()}</button>
          </>
        ) : (
          <>
            <NavLink className="header-auth-link" to="/login">Sign in</NavLink>
            <NavLink className="header-auth-button" to="/register">Create account</NavLink>
          </>
        )}
      </div>
    </header>
  );
}
