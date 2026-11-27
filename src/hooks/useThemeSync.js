import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProfile } from '../api/settingsApi';
import { applyTheme } from '../utils/theme';

// Loads the saved theme of the signed-in user and applies it.
export default function useThemeSync() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    fetchProfile(userId)
      .then((profile) => {
        if (active) applyTheme(profile.theme);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);
}