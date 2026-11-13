import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UilArrowLeft } from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import Avatar, { getDisplayName } from '../components/common/Avatar';
import { deleteAvatar, getAvatarUrl, uploadAvatar } from '../api/avatarApi';
import '../styles/settings.css';

const TIMEZONES = [
  { value: 'Europe/Kyiv', label: 'Eastern European Time (Kyiv)' },
  { value: 'Europe/Warsaw', label: 'Central European Time (Warsaw)' },
  { value: 'Europe/Berlin', label: 'Central European Time (Berlin)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (London)' },
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo)' },
];

export default function AccountSettingsPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(getDisplayName(user));
  const [timezone, setTimezone] = useState('Europe/Kyiv');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const email = user?.email || '';
  const avatarUrl = getAvatarUrl(user);
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '';

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ name });
      setMessage('Profile updated.');
    } catch (saveError) {
      setError(saveError.message || 'Could not update your profile.');
    } finally {
      setSaving(false);
    }
  }

  async function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await uploadAvatar(file);
      setMessage('Profile photo updated.');
    } catch (uploadError) {
      setError(uploadError.message || 'Could not update the photo.');
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await deleteAvatar();
      setMessage('Profile photo removed.');
    } catch (removeError) {
      setError(removeError.message || 'Could not remove the photo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="hours-settings">
      <Link to="/settings" className="cal-back">
        <UilArrowLeft size="18" /> Back
      </Link>

      <div className="acc-layout">
        <div className="acc-side">
          <Avatar user={user} size={72} />
        </div>

        <div className="acc-main">
          <h1 className="acc-name">{getDisplayName(user)}</h1>
          {joined && <div className="acc-joined">Joined {joined}</div>}

          <div className="acc-photo-actions">
            <label className="profile-file-button" htmlFor="account-photo">Change photo</label>
            <input
              id="account-photo"
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={changePhoto}
            />
            {avatarUrl && (
              <button type="button" className="acc-text-button" disabled={saving} onClick={removePhoto}>
                Remove photo
              </button>
            )}
          </div>

          <form className="acc-form" onSubmit={saveProfile}>
            <label className="acc-field">
              <span>Display name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required />
            </label>

            <label className="acc-field">
              <span>Email</span>
              <input value={email} readOnly />
            </label>

            <label className="acc-field">
              <span>Timezone</span>
              <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </label>

            <div>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>

          {message && <p className="settings-success" role="status">{message}</p>}
          {error && <p className="settings-error" role="alert">{error}</p>}

          <section className="acc-manage">
            <h2 className="cal-heading">Manage your account</h2>
            <p className="hours-text">
              Export your personal data or permanently delete your account and all data.
            </p>
            <div className="acc-manage-actions">
              <button type="button" className="acc-secondary-button">Export my data</button>
              <button type="button" className="acc-danger-button">Delete account</button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}