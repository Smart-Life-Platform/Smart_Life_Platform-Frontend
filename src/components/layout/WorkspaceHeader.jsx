import { UilBell, UilSearch } from '@iconscout/react-unicons';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import '../../styles/avenor.css';

const pageNames = {
  '/planner': 'Planner',
  '/kanban': 'Task board',
  '/budget': 'Budget',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export default function WorkspaceHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const pageName = pageNames[location.pathname] || 'Smart Life';

  return (
    <header className="workspace-header global-workspace-header">
      <div className="breadcrumbs"><span>Personal space</span><b>›</b><strong>{pageName}</strong></div>
      <div className="workspace-actions">
        <div className="global-search"><UilSearch size="16" /><input placeholder="Search anything..." aria-label="Search anything" /></div>
        <button className="icon-button" aria-label="Notifications"><UilBell size="15" /></button>
        <button className="header-avatar header-avatar-image" aria-label="User account"><Avatar user={user} size={25} /></button>
      </div>
    </header>
  );
}
