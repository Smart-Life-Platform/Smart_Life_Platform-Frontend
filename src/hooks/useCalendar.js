import { useMemo, useState } from 'react';
import { addDays, dateKey, startOfWeek } from '../utils/dateUtils';

export default function useCalendar() {
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(week, index)), [week]);
  const shiftWeek = (amount) => setWeek((current) => addDays(current, amount * 7));
  const resetToToday = () => setWeek(startOfWeek(new Date()));
  const todayKey = () => dateKey(new Date());

  return { week, days, shiftWeek, resetToToday, todayKey };
}