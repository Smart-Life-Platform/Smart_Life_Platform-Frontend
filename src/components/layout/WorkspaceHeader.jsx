import { UilBell, UilSearch } from '@iconscout/react-unicons';
import { useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';
import { useBoardSpaces } from '../../hooks/useBoardSpaces';
import '../../styles/workspace.css';

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
  const { activeSpace } = useBoardSpaces();
  // Only the board page belongs to a board's space; settings, profile and the
  // assistant are account pages and stay in the user's own space.
  const spaceLabel = location.pathname === '/kanban' ? activeSpace.label : 'Personal space';

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
          <span className="nav-icon icon-panel-left" aria-hidden="true" />
        </button>
        <div className="breadcrumbs"><span>{spaceLabel}</span><b>›</b><strong>{pageName}</strong></div>
      </div>
      <div className="workspace-actions">
        <div className="global-search"><UilSearch size="16" /><input placeholder="Search anything..." aria-label="Search anything" /></div>
        <button className="icon-button" aria-label="Notifications"><UilBell size="15" /></button>
        <UserMenu variant="header" size={26} />
      </div>
    </header>
  );
}
