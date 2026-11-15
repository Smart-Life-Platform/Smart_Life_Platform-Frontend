import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProfileSettings } from '../api/settingsApi';
import { DEFAULT_SETTINGS, mergeDeep } from '../utils/settingsDefaults';
import { setTimezoneCookie } from '../utils/timezone';

// Settings the calendar needs: hours, holidays switch and the saved timezone.
export default function useCalendarSettings() {
  const { user } = useAuth();
  const userId = user?.id;
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    fetchProfileSettings(userId)
      .then((profile) => {
        if (!active) return;
        if (profile.timezone && profile.timezone !== 'UTC') setTimezoneCookie(profile.timezone);
        setSettings(mergeDeep(DEFAULT_SETTINGS, profile.settings || {}));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);

  return { settings };
}