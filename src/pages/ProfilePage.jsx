import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UilCheck } from '@iconscout/react-unicons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Avatar, { getDisplayName } from '../components/common/Avatar';
import Toggle from '../components/settings/Toggle';
import GoogleCalendarCard from '../components/integrations/GoogleCalendarCard';
import { deleteAvatar, getAvatarUrl, uploadAvatar } from '../api/avatarApi';
import { fetchProfile, saveProfile } from '../api/settingsApi';
import { DEFAULT_SETTINGS, mergeDeep, timezoneOptions } from '../utils/settingsDefaults';
import { applyTheme, normalizeTheme, readLocalTheme, setDocumentTheme } from '../utils/theme';
import { setTimezoneCookie } from '../utils/timezone';
import '../styles/profile.css';
import '../styles/settings.css';
import '../styles/profile-page.css';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'uk', label: 'Ukrainian' },
];

const NOTIFICATIONS = [
  { key: 'dailyBriefing', title: 'Daily briefing', text: 'An overview of your day, delivered at 8:00 AM.' },
  { key: 'deadlineReminders', title: 'Deadline reminders', text: 'A reminder before important tasks are due.' },
  { key: 'weeklyReview', title: 'Weekly review', text: 'Your progress and priorities, every Sunday.' },
];

const PHONE_PATTERN = /^[+()\-\d\s]*$/;

function friendlyError(error) {
  if (error?.name === 'AuthSessionMissingError') {
    return 'Your session has no Supabase login. Sign out and sign in again.';
  }
  return error?.message || 'Could not save your changes.';
}

function signature(value) {
  return JSON.stringify([
    value.name.trim(),
    value.phone.trim(),
    value.location.trim(),
    value.language,
    value.timezone,
    value.theme,
    value.notifications.dailyBriefing,
    value.notifications.deadlineReminders,
    value.notifications.weeklyReview,
  ]);
}

function ThemeCard({ value, label, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`pf-theme-card${selected ? ' selected' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(value)}
    >
      <span className={`pf-theme-preview pf-theme-${value}`} aria-hidden="true">
        <span className="pf-tp-side"><span className="pf-tp-dot" /><span className="pf-tp-dot" /><span className="pf-tp-dot" /></span>
        <span className="pf-tp-main"><span className="pf-tp-bar" /><span className="pf-tp-box" /><span className="pf-tp-box" /></span>
      </span>
      <span className="pf-theme-label">
        <span className={`pf-check${selected ? ' on' : ''}`}>{selected && <UilCheck size="12" />}</span>
        {label}
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [params] = useSearchParams();
  const calendarResult = params.get('calendar');

  const userId = user?.id;
  const meta = user?.user_metadata || {};
  const email = user?.email || '';
  const currentName = getDisplayName(user);
  const savedPhone = meta.phone_number || '';
  const savedLocation = meta.location || '';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const [server, setServer] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [savedUser, setSavedUser] = useState(null);
  const [notice, setNotice] = useState(null);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const initialRef = useRef({ name: currentName, phone: savedPhone, location: savedLocation });
  initialRef.current = { name: currentName, phone: savedPhone, location: savedLocation };

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    fetchProfile(userId)
      .then((profile) => {
        if (!active) return;
        const settings = mergeDeep(DEFAULT_SETTINGS, profile.settings || {});
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const loaded = {
          timezone: profile.timezone && profile.timezone !== 'UTC' ? profile.timezone : browserTimezone || 'UTC',
          language: profile.language === 'uk' ? 'uk' : 'en',
          theme: normalizeTheme(profile.theme),
          notifications: settings.notifications,
        };
        settingsRef.current = settings;
        setServer(loaded);
        setDraft({ ...initialRef.current, ...loaded });
      })
      .catch((error) => {
        if (active) setLoadError(error.message || 'Could not load your profile settings.');
      });
    return () => {
      active = false;
    };
  }, [userId]);

  // A theme picked but not saved is only a preview: put the stored one back when leaving.
  useEffect(() => () => setDocumentTheme(readLocalTheme()), []);

  const saved = server ? { name: currentName, phone: savedPhone, location: savedLocation, ...server } : null;
  const dirty = Boolean(saved && draft) && signature(draft) !== signature(saved);
  const avatarUser = savedUser?.id === userId ? savedUser : user;
  const avatarUrl = getAvatarUrl(avatarUser);

  function setField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function chooseTheme(theme) {
    setField('theme', theme);
    setDocumentTheme(theme);
  }

  function setNotification(key, value) {
    setDraft((current) => ({ ...current, notifications: { ...current.notifications, [key]: value } }));
  }

  function handleCancel() {
    if (!saved) return;
    setDraft(saved);
    setDocumentTheme(saved.theme);
    setNotice(null);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!dirty || saving) return;

    const name = draft.name.trim();
    const phone = draft.phone.trim();
    const location = draft.location.trim();
    if (!name) {
      setNotice({ type: 'error', text: 'Enter your name.' });
      return;
    }
    if (!PHONE_PATTERN.test(phone)) {
      setNotice({ type: 'error', text: 'Phone number may only contain digits, spaces and + ( ) -' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      if (name !== currentName) await updateProfile({ name });

      if (phone !== savedPhone || location !== savedLocation) {
        const { error } = await supabase.auth.updateUser({ data: { phone_number: phone, location } });
        if (error) throw error;
      }

      const nextSettings = mergeDeep(settingsRef.current, { notifications: draft.notifications });
      const profile = await saveProfile(userId, {
        timezone: draft.timezone,
        language: draft.language,
        theme: draft.theme,
        settings: nextSettings,
      });
      settingsRef.current = mergeDeep(DEFAULT_SETTINGS, profile.settings || {});

      setServer({
        timezone: draft.timezone,
        language: draft.language,
        theme: draft.theme,
        notifications: draft.notifications,
      });
      setDraft((current) => ({ ...current, name, phone, location }));
      setTimezoneCookie(draft.timezone);
      applyTheme(draft.theme);
      setNotice({ type: 'success', text: 'Profile updated.' });
    } catch (saveError) {
      setNotice({ type: 'error', text: friendlyError(saveError) });
    } finally {
      setSaving(false);
    }
  }

  async function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    setNotice(null);
    try {
      const result = await uploadAvatar(file);
      setSavedUser(result.user);
      setNotice({
        type: 'success',
        text: result.cleanupFailed ? 'Photo saved. The previous file could not be removed.' : 'Profile photo updated.',
      });
    } catch (uploadError) {
      setNotice({ type: 'error', text: friendlyError(uploadError) });
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setNotice(null);
    try {
      const result = await deleteAvatar();
      setSavedUser(result.user);
      setNotice({ type: 'success', text: 'Profile photo removed.' });
    } catch (removeError) {
      setNotice({ type: 'error', text: friendlyError(removeError) });
    } finally {
      setPhotoBusy(false);
    }
  }

  const heroMeta = [savedLocation, memberSince && `Member since ${memberSince}`].filter(Boolean).join(' · ');

  return (
    <main className="pf-page">
      <div className="pf-inner">
        <header className="pf-title">
          <h1>Profile</h1>
          <p>Manage your personal information and workspace preferences.</p>
        </header>

        <section className="pf-card pf-hero" aria-busy={photoBusy}>
          <Avatar user={avatarUser} size={72} />
          <div className="pf-hero-info">
            <div className="pf-hero-name">
              <h2>{currentName}</h2>
              <span className="pf-badge">Personal</span>
            </div>
            <div className="pf-hero-email">{email}</div>
            {heroMeta && <div className="pf-hero-meta">{heroMeta}</div>}
          </div>
          <div className="pf-hero-actions">
            {avatarUrl && (
              <button type="button" className="pf-link" disabled={photoBusy} onClick={removePhoto}>
                Remove photo
              </button>
            )}
            <label className="pf-button" htmlFor="pf-photo">{photoBusy ? 'Uploading…' : 'Change photo'}</label>
            <input
              id="pf-photo"
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={photoBusy}
              onChange={changePhoto}
            />
          </div>
        </section>

        {loadError && <p className="pf-notice error" role="alert">{loadError}</p>}
        {!draft && !loadError && <p className="pf-notice" role="status">Loading your profile…</p>}

        {draft && (
          <form onSubmit={handleSave}>
            <div className="pf-grid">
              <div className="pf-col">
                <section className="pf-card">
                  <h2>Personal information</h2>
                  <p className="pf-card-sub">Update the details associated with your account.</p>
                  <div className="pf-fields">
                    <label className="pf-field">
                      <span>Full name</span>
                      <input
                        value={draft.name}
                        maxLength={60}
                        required
                        onChange={(event) => setField('name', event.target.value)}
                      />
                    </label>
                    <label className="pf-field">
                      <span>Email address</span>
                      <input value={email} readOnly />
                    </label>
                    <label className="pf-field">
                      <span>Phone number</span>
                      <input
                        type="tel"
                        value={draft.phone}
                        maxLength={24}
                        placeholder="+380 00 000 0000"
                        onChange={(event) => setField('phone', event.target.value)}
                      />
                    </label>
                    <label className="pf-field">
                      <span>Location</span>
                      <input
                        value={draft.location}
                        maxLength={80}
                        placeholder="City, Country"
                        onChange={(event) => setField('location', event.target.value)}
                      />
                    </label>
                  </div>
                  <p className="pf-note">Your personal information is only visible to you.</p>
                </section>

                <section className="pf-card">
                  <h2>Account preferences</h2>
                  <p className="pf-card-sub">Choose your language and regional settings.</p>
                  <div className="pf-fields">
                    <label className="pf-field">
                      <span>Language</span>
                      <select value={draft.language} onChange={(event) => setField('language', event.target.value)}>
                        {LANGUAGES.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="pf-field">
                      <span>Time zone</span>
                      <select value={draft.timezone} onChange={(event) => setField('timezone', event.target.value)}>
                        {timezoneOptions(draft.timezone).map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>
              </div>

              <div className="pf-col">
                <section className="pf-card">
                  <h2>Appearance</h2>
                  <p className="pf-card-sub">Choose how your workspace looks.</p>
                  <div className="pf-themes">
                    <ThemeCard value="light" label="Light Theme" selected={draft.theme === 'light'} onSelect={chooseTheme} />
                    <ThemeCard value="dark" label="Dark Theme" selected={draft.theme === 'dark'} onSelect={chooseTheme} />
                  </div>
                  <p className="pf-note">{draft.theme === 'dark' ? 'Dark' : 'Light'} Theme is selected.</p>
                </section>

                <section className="pf-card">
                  <h2>Notifications</h2>
                  <p className="pf-card-sub">Choose which updates you receive.</p>
                  <div className="pf-notify">
                    {NOTIFICATIONS.map((item) => (
                      <div className="pf-notify-row" key={item.key}>
                        <div>
                          <div className="pf-notify-title">{item.title}</div>
                          <div className="pf-notify-text">{item.text}</div>
                        </div>
                        <Toggle
                          checked={draft.notifications[item.key]}
                          onChange={(value) => setNotification(item.key, value)}
                          label={item.title}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="pf-footer">
              <span className="pf-tagline">Thoughtfully personal. Always private.</span>
              <div className="pf-footer-actions">
                <button type="button" className="pf-cancel" disabled={!dirty || saving} onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="pf-save" disabled={!dirty || saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        )}

        {notice && <p className={`pf-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</p>}

        {/* Google Calendar connection (existing feature) stays next to the account. */}
        <div className="pf-integrations">
          {calendarResult === 'connected' && <p className="pf-notice success" role="status">Google Calendar connected.</p>}
          {calendarResult === 'error' && <p className="pf-notice error" role="alert">Google Calendar could not be connected. Please try connecting again.</p>}
          <GoogleCalendarCard />
        </div>
      </div>
    </main>
  );
}