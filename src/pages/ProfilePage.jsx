import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl, uploadAvatar } from '../api/avatarApi';
import '../styles/profile.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [savedUser, setSavedUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentUser = savedUser?.id === user?.id ? savedUser : user;
  const avatarUrl = getAvatarUrl(currentUser);

  async function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await uploadAvatar(file);
      setSavedUser(result.user);
      setMessage(result.cleanupFailed ? 'Photo saved. The previous file could not be removed.' : 'Profile photo saved.');
    } catch (err) {
      setError(err.message || 'Could not upload the photo. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="profile-page">
      <section className="profile-card" aria-busy={busy}>
        <h1>My profile</h1>
        {avatarUrl ? <img className="profile-photo" src={avatarUrl} alt="Your profile" /> : <div className="profile-photo profile-initial" aria-label="No profile photo">{user?.email?.[0]?.toUpperCase() || '?'}</div>}
        <p>{user?.email}</p>
        <label htmlFor="profile-photo">Profile photo</label>
        <input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={changePhoto} aria-describedby="photo-help" />
        <p id="photo-help" className="muted">JPEG, PNG or WebP, up to 5 MB. Photos are accessible to anyone with their link.</p>
        {busy && <p role="status">Uploading photo…</p>}
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
      </section>
    </main>
  );
}
