import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
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
import { TaskProvider } from '../context/TaskContext';
import WorkspaceHeader from '../components/layout/WorkspaceHeader';

function SiteLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  return <TaskProvider><Header /><main className={`site-content${isAuthPage ? ' auth-content' : ''}`}>{!isAuthPage && <WorkspaceHeader />}<Outlet /></main></TaskProvider>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route>
            <Route path="/" element={<Navigate to="/planner" replace />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/statistics" element={<NotFoundPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/ai-assistant" element={<NotFoundPage />} />
            <Route path="/automations" element={<NotFoundPage />} />
            <Route path="/knowledge" element={<NotFoundPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
