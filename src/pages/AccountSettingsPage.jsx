import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UilArrowLeft } from '@iconscout/react-unicons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Avatar, { getDisplayName } from '../components/common/Avatar';
import SaveStatus from '../components/settings/SaveStatus';
import useProfileSettings from '../hooks/useProfileSettings';
import { deleteAvatar, getAvatarUrl, uploadAvatar } from '../api/avatarApi';
import { timezoneOptions } from '../utils/settingsDefaults';
import '../styles/settings.css';

const PROVIDER_LABELS = { google: 'Google', email: 'Email and password' };
const MIN_PASSWORD_LENGTH = 6;

function getProviders(user) {
  const meta = user?.app_metadata || {};
  if (Array.isArray(meta.providers) && meta.providers.length) return meta.providers;
  return meta.provider ? [meta.provider] : [];
}

export default function AccountSettingsPage() {
  const { user, updateProfile } = useAuth();
  const {
    loading,
    timezone,
    settings,
    status,
    error: settingsError,
    updateTimezone,
  } = useProfileSettings();

  const [name, setName] = useState(getDisplayName(user));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const email = user?.email || '';
  const currentName = getDisplayName(user);
  const nameChanged = name.trim() !== '' && name.trim() !== currentName;
  const avatarUrl = getAvatarUrl(user);
  const options = timezoneOptions(timezone);
  const providers = getProviders(user);
  const hasPassword = providers.includes('email');
  const providerLabel = providers.map((item) => PROVIDER_LABELS[item] || item).join(', ');
  const joined = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  async function saveName(event) {
    event.preventDefault();
    if (!nameChanged) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ name: name.trim() });
      setName(name.trim());
      setMessage('Name updated.');
    } catch (saveError) {
      setError(saveError.message || 'Could not update your name.');
    } finally {
      setBusy(false);
    }
  }

  async function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await uploadAvatar(file);
      setMessage('Profile photo updated.');
    } catch (uploadError) {
      setError(uploadError.message || 'Could not update the photo.');
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await deleteAvatar();
      setMessage('Profile photo removed.');
    } catch (removeError) {
      setError(removeError.message || 'Could not remove the photo.');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password updated.');
    } catch (updateError) {
      setPasswordError(updateError.message || 'Could not update the password.');
    } finally {
      setPasswordBusy(false);
    }
  }

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      account: { id: user?.id, email, createdAt: user?.created_at, signInMethods: providers },
      profile: { name: currentName, avatarUrl, timezone },
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-life-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
          <h1 className="acc-name">{currentName}</h1>
          <div className="acc-joined">
            {joined && <>Joined {joined}</>}
            {providerLabel && <> · Signed in with {providerLabel}</>}
          </div>

          <div className="acc-photo-actions">
            <label className="profile-file-button" htmlFor="account-photo">Change photo</label>
            <input
              id="account-photo"
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={changePhoto}
            />
            {avatarUrl && (
              <button type="button" className="acc-text-button" disabled={busy} onClick={removePhoto}>
                Remove photo
              </button>
            )}
          </div>

          <form className="acc-form" onSubmit={saveName}>
            <label className="acc-field">
              <span>Display name</span>
              <input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} required />
            </label>

            <label className="acc-field">
              <span>Email</span>
              <input value={email} readOnly />
              <small className="acc-hint">Your email is tied to how you sign in, so it can&apos;t be changed here.</small>
            </label>

            <div>
              <button type="submit" className="primary-button" disabled={busy || !nameChanged}>
                {busy ? 'Saving…' : 'Save name'}
              </button>
            </div>
          </form>

          {message && <p className="settings-success" role="status">{message}</p>}
          {error && <p className="settings-error" role="alert">{error}</p>}

          <div className="acc-form acc-section">
            <label className="acc-field">
              <span>Timezone</span>
              <select
                value={timezone}
                disabled={loading}
                onChange={(event) => updateTimezone(event.target.value)}
              >
                {options.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <small className="acc-hint">Saved automatically.</small>
            </label>
            <SaveStatus status={status} error={settingsError} />
          </div>

          <section className="acc-section">
            <h2 className="cal-heading">Password</h2>
            {hasPassword ? (
              <form className="acc-form" onSubmit={changePassword}>
                <label className="acc-field">
                  <span>New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
                <label className="acc-field">
                  <span>Confirm new password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </label>
                <div>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={passwordBusy || !newPassword || !confirmPassword}
                  >
                    {passwordBusy ? 'Saving…' : 'Change password'}
                  </button>
                </div>
                {passwordMessage && <p className="settings-success" role="status">{passwordMessage}</p>}
                {passwordError && <p className="settings-error" role="alert">{passwordError}</p>}
              </form>
            ) : (
              <p className="hours-text">
                You signed in with Google, so your password is managed by your Google account.
              </p>
            )}
          </section>

          <section className="acc-manage">
            <h2 className="cal-heading">Manage your account</h2>
            <p className="hours-text">
              Export your personal data or permanently delete your account and all data.
            </p>
            <div className="acc-manage-actions">
              <button type="button" className="acc-secondary-button" onClick={exportData}>Export my data</button>
              <button type="button" className="acc-danger-button" disabled title="Requires backend support">
                Delete account
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}