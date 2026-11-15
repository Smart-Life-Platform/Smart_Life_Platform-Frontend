import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProfileSettings } from '../api/settingsApi';
import { DEFAULT_SETTINGS, mergeDeep } from '../utils/settingsDefaults';
import { setTimezoneCookie } from '../utils/timezone';

// All saved settings the rest of the app needs (hours, holidays, preferences, timezone).
export default function useCalendarSettings() {
  const { user } = useAuth();
  const userId = user?.id;
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    fetchProfileSettings(userId)
      .then((profile) => {
        if (!active) return;
        if (profile.timezone && profile.timezone !== 'UTC') setTimezoneCookie(profile.timezone);
        setSettings(mergeDeep(DEFAULT_SETTINGS, profile.settings || {}));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return { settings, loaded };
}