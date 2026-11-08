import { expensesByCategory } from '../components/budget/budgetUtils';

test('aggregates only expenses and preserves percentages for uncategorized expenses', () => {
  const categories = [
    { id: 1, type: 'expense' }, { id: 2, type: 'expense' },
    { id: 3, type: 'income' }, { id: 4, type: 'expense' },
  ];
  const records = [
    { category_id: 1, type: 'expense', amount: 20 },
    { category_id: 1, type: 'expense', amount: 30 },
    { category_id: 2, type: 'expense', amount: 100 },
    { category_id: null, type: 'expense', amount: 50 },
    { category_id: 1, type: 'income', amount: 1000 },
  ];
  expect(expensesByCategory(records, categories)).toEqual([
    { category: categories[1], total: 100, percent: 50 },
    { category: categories[0], total: 50, percent: 25 },
  ]);
});

test('returns no category totals when there are no expenses', () => {
  expect(expensesByCategory([], [{ id: 1, type: 'expense' }])).toEqual([]);
});
