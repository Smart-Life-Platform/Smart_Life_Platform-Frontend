import { useMemo, useState } from 'react';
import { addDays, dateKey, startOfWeek } from '../utils/dateUtils';

export default function useCalendar(view = 'week') {
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => {
    if (view === 'day' || view === '4hours' || view === 'hour') return [week];
    if (view === 'month') {
      const monthStart = new Date(week.getFullYear(), week.getMonth(), 1);
      const gridStart = startOfWeek(monthStart);
      return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
    }
    return Array.from({ length: 7 }, (_, index) => addDays(week, index));
  }, [view, week]);
  const shiftWeek = (amount) => setWeek((current) => {
    if (view === 'month') return new Date(current.getFullYear(), current.getMonth() + amount, 1);
    if (view === 'day' || view === '4hours' || view === 'hour') return addDays(current, amount);
    return addDays(current, amount * 7);
  });
  const resetToToday = () => setWeek(startOfWeek(new Date()));
  const goToDate = (value) => {
    const date = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(date.getTime())) setWeek(view === 'week' || view === 'month' ? startOfWeek(date) : date);
  };
  const todayKey = () => dateKey(new Date());

  return { week, days, shiftWeek, resetToToday, goToDate, todayKey };
}