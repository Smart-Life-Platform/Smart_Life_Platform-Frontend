import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BudgetPage from '../pages/BudgetPage';
import * as api from '../api/budgetApi';

jest.mock('../api/budgetApi', () => ({
  getBudgetCategories: jest.fn(), getShoppingLists: jest.fn(), getBudgetRecords: jest.fn(),
  getBudgetSummary: jest.fn(), createBudgetRecord: jest.fn(),
  updateBudgetCategory: jest.fn(), deleteBudgetRecord: jest.fn(), createShoppingList: jest.fn(),
  deleteShoppingList: jest.fn(), createShoppingItem: jest.fn(),
  setShoppingItemPurchased: jest.fn(), deleteShoppingItem: jest.fn(),
}));
jest.mock('../components/budget/ExpensesChart/ExpensesChart', () => () => <div>Chart</div>);
jest.mock('../components/budget/BudgetOverview/BudgetOverview', () => ({ income }) => <p>Income: {income}</p>);
jest.mock('../components/budget/ShoppingList/ShoppingList', () => ({ lists }) => <p>Lists: {lists.length}</p>);
jest.mock('../components/budget/TransactionForm/TransactionForm', () => ({ onAdd }) =>
  <button onClick={() => onAdd({ amount: 5 })}>Save transaction</button>);
jest.mock('../components/budget/TransactionList/TransactionList', () => ({ records }) => <p>Records: {records.length}</p>);

beforeEach(() => {
  jest.resetAllMocks();
  api.getBudgetCategories.mockResolvedValue([]);
  api.getBudgetSummary.mockResolvedValue({ income: 100, expense: 0, by_category: [] });
  api.getBudgetRecords.mockResolvedValue([]);
  api.getShoppingLists.mockResolvedValue([]);
});

test('overview only requests categories and summary; shopping cannot delay it', async () => {
  api.getShoppingLists.mockReturnValue(new Promise(() => {}));
  render(<BudgetPage />);
  await screen.findByText('Income: 100');
  expect(api.getBudgetCategories).toHaveBeenCalledTimes(1);
  expect(api.getBudgetSummary).toHaveBeenCalledTimes(1);
  expect(api.getShoppingLists).not.toHaveBeenCalled();
  expect(api.getBudgetRecords).not.toHaveBeenCalled();
});

test('loads shopping on demand once and keeps it on tab switches', async () => {
  api.getShoppingLists.mockResolvedValue([{ id: 1 }]);
  render(<BudgetPage />);
  await screen.findByText('Income: 100');
  fireEvent.click(screen.getByRole('button', { name: 'Shopping' }));
  await screen.findByText('Lists: 1');
  fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
  fireEvent.click(screen.getByRole('button', { name: 'Shopping' }));
  expect(screen.getByText('Lists: 1')).toBeInTheDocument();
  expect(api.getShoppingLists).toHaveBeenCalledTimes(1);
  expect(api.getBudgetRecords).not.toHaveBeenCalled();
});

test('transaction mutations refresh summary and active transaction history', async () => {
  api.createBudgetRecord.mockResolvedValue({ id: 1 });
  render(<BudgetPage />);
  await screen.findByText('Income: 100');
  fireEvent.click(screen.getByRole('button', { name: 'Transactions' }));
  await screen.findByText('Records: 0');
  fireEvent.click(screen.getByRole('button', { name: 'Save transaction' }));
  await waitFor(() => expect(api.getBudgetRecords).toHaveBeenCalledTimes(2));
  expect(api.getBudgetSummary).toHaveBeenCalledTimes(2);
  expect(api.getShoppingLists).not.toHaveBeenCalled();
});

test('a slow summary for a previous month cannot overwrite the selected month', async () => {
  let finishOld;
  api.getBudgetSummary.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
    .mockResolvedValueOnce({ income: 200, expense: 0, by_category: [] });
  render(<BudgetPage />);
  fireEvent.click(screen.getByLabelText('Next month'));
  await screen.findByText('Income: 200');
  await act(async () => { finishOld({ income: 999, expense: 0, by_category: [] }); });
  expect(screen.queryByText('Income: 999')).not.toBeInTheDocument();
  expect(api.getBudgetRecords).not.toHaveBeenCalled();
});

test('a failed shopping load can be retried without blocking the overview', async () => {
  api.getShoppingLists.mockRejectedValueOnce(new Error('Shopping unavailable')).mockResolvedValueOnce([]);
  render(<BudgetPage />);
  await screen.findByText('Income: 100');
  fireEvent.click(screen.getByRole('button', { name: 'Shopping' }));
  await screen.findByText('Shopping unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
  expect(screen.getByText('Income: 100')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  fireEvent.click(screen.getByRole('button', { name: 'Shopping' }));
  await screen.findByText('Lists: 0');
  expect(api.getShoppingLists).toHaveBeenCalledTimes(2);
});
