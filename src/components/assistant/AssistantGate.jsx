import { Link } from 'react-router-dom';
import AssistantPage from '../../pages/AssistantPage';
import useCalendarSettings from '../../hooks/useCalendarSettings';

export default function AssistantGate() {
  const { settings, loaded } = useCalendarSettings();

  if (!loaded) return null;

  if (!settings.preferences.aiEnabled) {
    return (
      <div className="assistant-off">
        <h2>AI assistant is turned off</h2>
        <p>You can turn it back on in your settings.</p>
        <Link to="/settings/preferences">Open Preferences</Link>
      </div>
    );
  }

  return <AssistantPage />;
}