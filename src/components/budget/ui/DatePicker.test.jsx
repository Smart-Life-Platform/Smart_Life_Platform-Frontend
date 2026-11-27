import { render, screen, fireEvent } from '@testing-library/react';
import DatePicker, { todayIso } from './DatePicker';

jest.mock('@iconscout/react-unicons', () => new Proxy({}, { get: () => () => null }));

const setup = (value = '2026-10-25') => {
  const onChange = jest.fn();
  render(<DatePicker value={value} onChange={onChange} />);
  return onChange;
};
const open = () => fireEvent.click(screen.getByRole('button', { name: 'Date' }));

describe('DatePicker', () => {
  it('показує дату у форматі ДД.ММ.РРРР', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Date' }).textContent).toBe('25.10.2026');
  });

  it('календар відкривається на місяці вибраної дати з потрібною кількістю днів', () => {
    setup();
    open();
    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getAllByRole('button').filter((b) => /^\d{1,2}$/.test(b.textContent))).toHaveLength(31);
    expect(screen.getByRole('button', { name: '25' }).className).toMatch(/is-selected/);
  });

  it('тиждень починається з понеділка: 1 жовтня 2026 — четвер', () => {
    setup();
    open();
    const grid = screen.getByRole('button', { name: '1' }).parentElement;
    const cells = [...grid.children];
    expect(cells.indexOf(screen.getByRole('button', { name: '1' }))).toBe(7 + 3); // 7 заголовків + 3 порожні клітинки
  });

  it('вибір дня викликає onChange і закриває календар', () => {
    const onChange = setup();
    open();
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    expect(onChange).toHaveBeenCalledWith('2026-10-09');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('стрілки перемикають місяць, зокрема через межу року', () => {
    const onChange = setup('2026-12-15');
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('January 2027')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    expect(onChange).toHaveBeenCalledWith('2027-01-01');
  });

  it('лютий у високосному році має 29 днів', () => {
    setup('2028-02-10');
    open();
    expect(screen.getAllByRole('button').filter((b) => /^\d{1,2}$/.test(b.textContent))).toHaveLength(29);
  });

  it('todayIso повертає локальну дату у форматі YYYY-MM-DD', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 5, 23, 59));
    expect(todayIso()).toBe('2026-11-05');
    jest.useRealTimers();
  });
});
