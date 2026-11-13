import {
  UilCalendarAlt,
  UilClock,
  UilSlidersV,
  UilUser,
  UilCloudUpload,
  UilUsersAlt,
  UilTimes,
} from '@iconscout/react-unicons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar, { getDisplayName } from '../components/common/Avatar';
import { deleteAvatar, getAvatarUrl, uploadAvatar } from '../api/avatarApi';
import '../styles/settings.css';

const cards = [
  { key: 'calendars', Icon: UilCalendarAlt, title: 'Calendars', text: 'Add & manage connected emails & calendars.', to: '/settings/calendars' },
  { key: 'hours', Icon: UilClock, title: 'Hours', text: 'Set & customize your personal, working, & meeting hours.', to: '/settings/hours' },
  { key: 'preferences', Icon: UilSlidersV, title: 'Preferences', text: 'Chat, scheduling window & meeting start time intervals.', to: '/settings/preferences' },
  { key: 'account', Icon: UilUser, title: 'Account', text: 'Update your profile info and manage your account.', to: '/settings/account' },
  { key: 'clockwise', Icon: UilCloudUpload, title: 'Clockwise Import', text: 'Import your settings and data from Clockwise.' },
  { key: 'team', Icon: UilUsersAlt, title: 'Team', text: 'Manage settings for others under your team.' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarEditing, setAvatarEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarUrl = getAvatarUrl(user);

  const email = user?.email || '';
  const displayName = getDisplayName(user);

  function chooseAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function saveAvatar() {
    if (!avatarFile) return;
    setSaving(true);
    setError('');
    try {
      await uploadAvatar(avatarFile);
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarEditing(false);
      setMessage('Profile icon updated.');
    } catch (uploadError) {
      setError(uploadError.message || 'Could not update the profile icon.');
    } finally {
      setSaving(false);
    }
  }

  async function removeAvatar() {
    setSaving(true);
    setError('');
    try {
      await deleteAvatar();
      setAvatarEditing(false);
      setMessage('Profile icon removed.');
    } catch (removeError) {
      setError(removeError.message || 'Could not remove the profile icon.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="settings-page">
      <div className="settings-profile">
        <button type="button" className="settings-avatar-button" onClick={() => setAvatarEditing(true)} aria-label="Change profile icon">
          <Avatar user={user} size={60} />
        </button>
        <div>
          <h1 className="settings-name">{displayName}</h1>
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
      {avatarEditing && <div className="modal-backdrop" onMouseDown={() => setAvatarEditing(false)}><div className="settings-form-card account-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="close-button account-modal-close" onClick={() => setAvatarEditing(false)}><UilTimes size="20" /></button>
        <h2>Profile icon</h2>
        <div className="avatar-preview-large">{avatarPreview ? <img src={avatarPreview} alt="New profile preview" /> : <Avatar user={user} size={96} />}</div>
        <label className="profile-file-button avatar-choose-button" htmlFor="settings-avatar">Choose new icon</label>
        <input id="settings-avatar" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} />
        {avatarFile && <p className="settings-file-name">{avatarFile.name}</p>}
        <div className="settings-form-actions"><button type="button" className="primary-button" disabled={!avatarFile || saving} onClick={saveAvatar}>{saving ? 'Saving…' : 'Save icon'}</button>{avatarUrl && <button type="button" className="settings-cancel-button" disabled={saving} onClick={removeAvatar}>Remove icon</button>}</div>
      </div></div>}
      {message && <p className="settings-success" role="status">{message}</p>}
      {error && <p className="settings-error" role="alert">{error}</p>}
    </main>
  );
}