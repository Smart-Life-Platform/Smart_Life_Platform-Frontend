import { render, screen } from '@testing-library/react';
import BudgetLimits from './BudgetLimits';

const categories = [
  { id: 1, name: 'Food', type: 'expense', monthly_limit: 100 },
  { id: 2, name: 'Fun', type: 'expense', monthly_limit: 100 },
  { id: 3, name: 'Rent', type: 'expense', monthly_limit: 100 },
  { id: 4, name: 'Transport', type: 'expense', monthly_limit: 0 },
  { id: 5, name: 'Salary', type: 'income', monthly_limit: 500 },
];
const items = [
  { category: categories[0], total: 50 },
  { category: categories[1], total: 90 },
  { category: categories[2], total: 130 },
];

describe('BudgetLimits', () => {
  it('показує підказку, якщо жодного ліміту не задано', () => {
    render(<BudgetLimits items={[]} categories={[{ id: 4, name: 'Transport', type: 'expense', monthly_limit: 0 }]} />);
    expect(screen.getByText('No limits set yet')).toBeTruthy();
  });

  it('ігнорує категорії без ліміту та категорії доходів', () => {
    render(<BudgetLimits items={items} categories={categories} />);
    expect(screen.queryByText('Transport')).toBeNull();
    expect(screen.queryByText('Salary')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('позначає стан: ок, попередження (>80%), перевищено (>100%)', () => {
    const { container } = render(<BudgetLimits items={items} categories={categories} />);
    const bars = [...container.querySelectorAll('.b-progress__bar')];
    expect(bars[0].className).not.toMatch(/is-warn|is-over/);
    expect(bars[1].className).toMatch(/is-warn/);
    expect(bars[2].className).toMatch(/is-over/);
  });

  it('обмежує ширину смуги 100% і показує Limit exceeded тільки при перевищенні', () => {
    const { container } = render(<BudgetLimits items={items} categories={categories} />);
    const bars = [...container.querySelectorAll('.b-progress__bar')];
    expect(bars[2].style.width).toBe('100%');
    expect(bars[0].style.width).toBe('50%');
    expect(screen.getAllByText('Limit exceeded')).toHaveLength(1);
  });

  it('витрати 0, якщо за категорією немає записів', () => {
    const { container } = render(<BudgetLimits items={[]} categories={[categories[0]]} />);
    expect(container.querySelector('.b-progress__bar').style.width).toBe('0%');
  });
});
