import { useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import PlannerPage from '../pages/PlannerPage';
import KanbanPage from '../pages/KanbanPage';
import NotFoundPage from '../pages/NotFoundPage';
import BudgetPage from '../pages/BudgetPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import AuthCallbackPage from '../pages/AuthCallbackPage';
import CalendarsSettingsPage from '../pages/CalendarsSettingsPage';
import HoursSettingsPage from '../pages/HoursSettingsPage';
import PreferencesSettingsPage from '../pages/PreferencesSettingsPage';
import AccountSettingsPage from '../pages/AccountSettingsPage';
import AssistantGate from '../components/assistant/AssistantGate';
import GoogleCalendarCallbackPage from '../pages/GoogleCalendarCallbackPage';
import ConnectCalendarPrompt from '../components/integrations/ConnectCalendarPrompt';
import { TaskProvider } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import WorkspaceHeader from '../components/layout/WorkspaceHeader';

/** The planner page now only hosts the calendar view; the board lives in /kanban. */
function PlannerRoute() {
  const [searchParams] = useSearchParams();
  return searchParams.get('view') === 'calendar' ? <PlannerPage /> : <Navigate to="/kanban" replace />;
}

function SiteLayout() {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isAuthPage = ['/login', '/register', '/auth/callback'].includes(location.pathname);

  // Login, registration and the OAuth callback are standalone screens: no sidebar, no
  // workspace header, no task store. They used to be drawn inside the workspace shell,
  // so a redirect to /login while a session was still present produced the login card
  // next to the full sidebar. Unauthenticated visitors of an app route get the bare
  // layout too, so ProtectedRoute redirects instead of flashing a sidebar.
  const withWorkspaceShell = !isAuthPage && (isAuthenticated || loading);
  if (!withWorkspaceShell) return <Outlet />;

  // Re-mount the task store when the account changes, so boards, statuses and tasks
  // of the previous account cannot survive in memory.
  return (
    <TaskProvider key={user?.id || 'anonymous'}>
      <Header collapsed={sidebarCollapsed} />
      <main className={`site-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <WorkspaceHeader
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        />
        <Outlet />
        <ConnectCalendarPrompt />
      </main>
    </TaskProvider>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* OAuth callback — must be outside ProtectedRoute so the session can be hydrated first */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route>
            <Route path="/" element={<Navigate to="/kanban" replace />} />
            <Route path="/overview" element={<NotFoundPage />} />
            <Route path="/planner" element={<PlannerRoute />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/statistics" element={<NotFoundPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/calendars" element={<CalendarsSettingsPage />} />
            <Route path="/settings/hours" element={<HoursSettingsPage />} />
            <Route path="/settings/preferences" element={<PreferencesSettingsPage />} />
            <Route path="/settings/account" element={<AccountSettingsPage />} />
            <Route path="/ai-assistant" element={<AssistantGate />} />
            <Route path="/automations" element={<NotFoundPage />} />
            <Route path="/knowledge" element={<NotFoundPage />} />
            <Route path="/google-calendar/callback" element={<GoogleCalendarCallbackPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}