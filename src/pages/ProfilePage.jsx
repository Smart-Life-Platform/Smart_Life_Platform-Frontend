import { useEffect, useState } from 'react';
import { UilCloudUpload, UilTrashAlt } from '@iconscout/react-unicons';
import { useAuth } from '../context/AuthContext';
import { deleteAvatar, getAvatarUrl, uploadAvatar } from '../api/avatarApi';
import '../styles/profile.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [savedUser, setSavedUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentUser = savedUser?.id === user?.id ? savedUser : user;
  const avatarUrl = getAvatarUrl(currentUser);
  const fallback = user?.email?.[0]?.toUpperCase() || '?';

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function savePhoto(file) {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await uploadAvatar(file);
      setPendingFile(null);
      setPreviewUrl(null);
      setSavedUser(result.user);
      setMessage(result.cleanupFailed
        ? 'Photo saved. The previous file could not be removed.'
        : 'Profile photo saved.');
    } catch (uploadError) {
      setError(uploadError.message || 'Could not upload the photo. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    selectPhoto(file);
  }

  function dropPhoto(event) {
    event.preventDefault();
    setDragging(false);
    selectPhoto(event.dataTransfer.files?.[0]);
  }

  function selectPhoto(file) {
    if (!file || busy) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setMessage('');
  }

  function cancelPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  }

  async function removePhoto() {
    if (busy || !avatarUrl) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await deleteAvatar();
      setSavedUser(result.user);
      setMessage(result.cleanupFailed
        ? 'Photo removed from your profile. The stored file could not be deleted.'
        : 'Profile photo removed.');
    } catch (removeError) {
      setError(removeError.message || 'Could not remove the photo. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="profile-page">
      <section className="profile-card" aria-busy={busy}>
        <div className="profile-heading">
          <div>
            <p className="profile-eyebrow">Account</p>
            <h1>My profile</h1>
            <p className="profile-email">{user?.email}</p>
          </div>
          {previewUrl
            ? <img className="profile-photo" src={previewUrl} alt="New profile avatar" />
            : avatarUrl
              ? <img className="profile-photo" src={avatarUrl} alt="Your profile" />
            : <div className="profile-photo profile-initial" aria-label="No profile photo">{fallback}</div>}
        </div>

        <div
          className={`avatar-dropzone${dragging ? ' is-dragging' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setDragging(false);
          }}
          onDrop={dropPhoto}
        >
          {previewUrl
            ? <>
              <p className="dropzone-title">Preview your new profile photo</p>
              <p className="dropzone-subtitle">Make sure it looks good before saving.</p>
            </>
            : <>
              <UilCloudUpload className="dropzone-icon" size="28" aria-hidden="true" />
              <p className="dropzone-title">Drag and drop your photo here</p>
              <p className="dropzone-subtitle">or choose a file from your device</p>
            </>}
          <label className="profile-file-button" htmlFor="profile-photo">
            {previewUrl ? 'Choose another' : 'Choose photo'}
          </label>
          <input
            id="profile-photo"
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={changePhoto}
            aria-describedby="photo-help"
          />
          {previewUrl && <div className="profile-preview-actions">
            <button type="button" className="profile-save-button" disabled={busy} onClick={() => savePhoto(pendingFile)}>
              {busy ? 'Saving…' : 'Use this photo'}
            </button>
            <button type="button" className="profile-cancel-button" disabled={busy} onClick={cancelPreview}>
              Cancel
            </button>
          </div>}
        </div>

        <p id="photo-help" className="profile-help">JPEG, PNG or WebP, up to 5 MB.</p>
        {avatarUrl && !previewUrl && <button type="button" className="profile-remove-button" disabled={busy} onClick={removePhoto}>
          <UilTrashAlt size="16" /> Remove profile photo
        </button>}
        {busy && <p role="status">Uploading photo…</p>}
        {message && <p className="profile-success" role="status">{message}</p>}
        {error && <p className="profile-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}
