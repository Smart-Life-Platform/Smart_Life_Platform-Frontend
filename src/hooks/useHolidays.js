import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProfileSettings } from '../api/settingsApi';
import { fetchHolidays } from '../api/holidaysApi';

// Returns { 'YYYY-MM-DD': ['Holiday name', ...] } for the days shown in the calendar.
export default function useHolidays(days) {
  const { user } = useAuth();
  const userId = user?.id;
  const [enabled, setEnabled] = useState(false);
  const [byYear, setByYear] = useState({});

  const yearsKey = useMemo(
    () => [...new Set(days.map((day) => day.getFullYear()))].join(','),
    [days],
  );

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    fetchProfileSettings(userId)
      .then((profile) => {
        if (active) setEnabled(profile.settings?.calendars?.holidaysEnabled === true);
      })
      .catch(() => {
        if (active) setEnabled(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    yearsKey.split(',').filter(Boolean).map(Number).forEach((year) => {
      fetchHolidays(year)
        .then((list) => {
          if (active) setByYear((current) => ({ ...current, [year]: list }));
        })
        .catch(() => {
          if (active) setByYear((current) => ({ ...current, [year]: [] }));
        });
    });
    return () => {
      active = false;
    };
  }, [enabled, yearsKey]);

  return useMemo(() => {
    if (!enabled) return {};
    const result = {};
    Object.values(byYear).flat().forEach(({ date, name }) => {
      result[date] = [...(result[date] || []), name];
    });
    return result;
  }, [enabled, byYear]);
}