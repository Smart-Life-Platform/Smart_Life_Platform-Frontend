import {
  UilCalendarAlt,
  UilClock,
  UilSlidersV,
  UilUser,
  UilCloudUpload,
  UilUsersAlt,
} from '@iconscout/react-unicons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar, { getDisplayName } from '../components/common/Avatar';
import '../styles/settings.css';

const cards = [
  { key: 'calendars', Icon: UilCalendarAlt, title: 'Calendars', text: 'Add & manage connected emails & calendars.', to: '/settings/calendars' },
  { key: 'hours', Icon: UilClock, title: 'Hours', text: 'Set & customize your personal, working, & meeting hours.', to: '/settings/hours' },
  { key: 'preferences', Icon: UilSlidersV, title: 'Preferences', text: 'Chat, scheduling window & meeting start time intervals.' },
  { key: 'account', Icon: UilUser, title: 'Account', text: 'Update your profile info and manage your account.' },
  { key: 'clockwise', Icon: UilCloudUpload, title: 'Clockwise Import', text: 'Import your settings and data from Clockwise.' },
  { key: 'team', Icon: UilUsersAlt, title: 'Team', text: 'Manage settings for others under your team.' },
];

export default function SettingsPage() {
  const { user } = useAuth();

  const email = user?.email || '';
  const name = getDisplayName(user);

  return (
    <main className="settings-page">
      <div className="settings-profile">
        <Avatar user={user} size={60} />
        <div>
          <h1 className="settings-name">{name}</h1>
          <div className="settings-email">{email}</div>
        </div>
      </div>

      <div className="settings-grid">
                {cards.map(({ key, Icon, title, text, to }) => {
          const content = (
            <>
              <Icon size="24" />
              <h2 className="settings-card-title">{title}</h2>
              <p className="settings-card-text">{text}</p>
            </>
          );
          return to
            ? <Link className="settings-card is-link" to={to} key={key}>{content}</Link>
            : <div className="settings-card" key={key}>{content}</div>;
        })}
      </div>
    </main>
  );
}