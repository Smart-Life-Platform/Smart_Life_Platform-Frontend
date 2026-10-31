import { act, renderHook } from '@testing-library/react';
import useCalendar from '../hooks/useCalendar';
import { dateKey } from '../utils/dateUtils';

test('preserves the selected date when opening a day from the month view', () => {
  const { result, rerender } = renderHook(({ view }) => useCalendar(view), {
    initialProps: { view: 'month' },
  });
  act(() => result.current.goToDate('2026-11-01'));
  expect(dateKey(result.current.week)).toBe('2026-11-01');
  rerender({ view: 'day' });
  expect(result.current.days.map(dateKey)).toEqual(['2026-11-01']);
});

test('aligns the week grid without changing the selected month', () => {
  const { result, rerender } = renderHook(({ view }) => useCalendar(view), {
    initialProps: { view: 'week' },
  });
  act(() => result.current.goToDate('2026-11-01'));
  expect(dateKey(result.current.days[0])).toBe('2026-10-26');
  expect(dateKey(result.current.week)).toBe('2026-11-01');
  rerender({ view: 'month' });
  expect(result.current.days).toHaveLength(42);
  act(() => result.current.shiftWeek(1));
  expect(dateKey(result.current.week)).toBe('2026-12-01');
});

test('ignores an empty date picker value', () => {
  const { result } = renderHook(() => useCalendar('day'));
  act(() => result.current.goToDate('2026-10-31'));
  act(() => result.current.goToDate(''));
  expect(dateKey(result.current.days[0])).toBe('2026-10-31');
});
