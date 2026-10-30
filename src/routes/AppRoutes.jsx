import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Header from '../components/layout/Header';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import PlannerPage from '../pages/PlannerPage';
import NotFoundPage from '../pages/NotFoundPage';
import SectionPage from '../pages/SectionPage';
import BudgetPage from '../pages/BudgetPage';
import SettingsPage from '../pages/SettingsPage';
import ProfilePage from '../pages/ProfilePage';
import { TaskProvider } from '../context/TaskContext';
import CalendarsSettingsPage from '../pages/CalendarsSettingsPage';
import HoursSettingsPage from '../pages/HoursSettingsPage';

function TaskProviderRoute() {
  return <TaskProvider><Outlet /></TaskProvider>;
}

function SiteLayout() {
  return <><Header /><Outlet /></>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<TaskProviderRoute />}>
            <Route path="/" element={<Navigate to="/planner" replace />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/statistics" element={<SectionPage title="Statistics" />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/calendars" element={<CalendarsSettingsPage />} />
            <Route path="/settings/hours" element={<HoursSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
