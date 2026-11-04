import { UilBell, UilSearch } from '@iconscout/react-unicons';
import { useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';
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
  const pageName = pageNames[location.pathname] || 'Smart Life';

  return (
    <header className="workspace-header global-workspace-header">
      <div className="breadcrumbs"><span>Personal space</span><b>›</b><strong>{pageName}</strong></div>
      <div className="workspace-actions">
        <div className="global-search"><UilSearch size="16" /><input placeholder="Search anything..." aria-label="Search anything" /></div>
        <button className="icon-button" aria-label="Notifications"><UilBell size="15" /></button>
        <UserMenu variant="header" size={26} />
      </div>
    </header>
  );
}
