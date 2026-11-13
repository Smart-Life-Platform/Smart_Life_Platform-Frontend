import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProfileSettings, saveProfileSettings } from '../api/settingsApi';
import { DEFAULT_SETTINGS, mergeDeep } from '../utils/settingsDefaults';

const SAVE_DELAY = 600;

export default function useProfileSettings() {
  const { user } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState('UTC');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const store = useRef({ timezone: 'UTC', settings: DEFAULT_SETTINGS });
  const dirty = useRef({ timezone: false, settings: false });
  const timer = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    fetchProfileSettings(userId)
      .then((profile) => {
        if (!active) return;
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const savedTimezone = profile.timezone && profile.timezone !== 'UTC' ? profile.timezone : null;
        store.current = {
          timezone: savedTimezone || browserTimezone || 'UTC',
          settings: mergeDeep(DEFAULT_SETTINGS, profile.settings || {}),
        };
        setTimezone(store.current.timezone);
        setSettings(store.current.settings);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.message || 'Could not load your settings.');
        setStatus('error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const { timezone: timezoneDirty, settings: settingsDirty } = dirty.current;
    if (!userId || (!timezoneDirty && !settingsDirty)) return;

    const patch = {};
    if (timezoneDirty) patch.timezone = store.current.timezone;
    if (settingsDirty) patch.settings = store.current.settings;
    dirty.current = { timezone: false, settings: false };

    setStatus('saving');
    setError('');
    try {
      await saveProfileSettings(userId, patch);
      setStatus('saved');
    } catch (saveError) {
      // keep the changes marked as unsaved so the next change retries them
      if (timezoneDirty) dirty.current.timezone = true;
      if (settingsDirty) dirty.current.settings = true;
      setError(saveError.message || 'Could not save your settings.');
      setStatus('error');
    }
  }, [userId]);

  const schedule = useCallback(() => {
    clearTimeout(timer.current);
    setStatus('saving');
    timer.current = setTimeout(flush, SAVE_DELAY);
  }, [flush]);

  const updateSettings = useCallback((patch) => {
    store.current.settings = mergeDeep(store.current.settings, patch);
    dirty.current.settings = true;
    setSettings(store.current.settings);
    schedule();
  }, [schedule]);

  const updateTimezone = useCallback((value) => {
    store.current.timezone = value;
    dirty.current.timezone = true;
    setTimezone(value);
    schedule();
  }, [schedule]);

  // save anything still pending when the page is closed
  useEffect(() => () => { flush(); }, [flush]);

  return { loading, timezone, settings, status, error, updateSettings, updateTimezone };
}