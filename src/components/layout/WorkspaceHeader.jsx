import { UilBell, UilSearch, UilColumns } from '@iconscout/react-unicons';
import { useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';
import '../../styles/avenor.css';

const pageNames = {
  '/overview': 'Overview',
  '/kanban': 'Task board',
  '/planner': 'Calendar',
  '/budget': 'Budget',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/ai-assistant': 'AI assistant',
};

export default function WorkspaceHeader({ onToggleSidebar, sidebarCollapsed = false }) {
  const location = useLocation();
  const pageName = pageNames[location.pathname] || 'Smart Life';

  return (
    <header className="workspace-header global-workspace-header">
      <div className="workspace-header-left">
        <button
          type="button"
          className="icon-button sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        >
          <UilColumns size="16" />
        </button>
        <div className="breadcrumbs"><span>Personal space</span><b>›</b><strong>{pageName}</strong></div>
      </div>
      <div className="workspace-actions">
        <div className="global-search"><UilSearch size="16" /><input placeholder="Search anything..." aria-label="Search anything" /></div>
        <button className="icon-button" aria-label="Notifications"><UilBell size="15" /></button>
        <UserMenu variant="header" size={26} />
      </div>
    </header>
  );
}
