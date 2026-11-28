import { apiClient } from './apiClient';
import {
  getBudgetCategories, updateBudgetCategory, getBudgetRecords, createBudgetRecord, getBudgetSummary,
  getShoppingLists, createShoppingList, createShoppingItem, setShoppingItemPurchased, deleteShoppingItem,
} from './budgetApi';

jest.mock('./apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const TIMEOUT = { timeout: 45000 };

beforeEach(() => jest.clearAllMocks());

describe('categories', () => {
  it('приймає і масив, і пагіновану відповідь { results }', async () => {
    apiClient.get.mockResolvedValueOnce({ data: [{ id: 1, monthly_limit: '10.50' }] });
    expect(await getBudgetCategories()).toEqual([{ id: 1, monthly_limit: 10.5 }]);

    apiClient.get.mockResolvedValueOnce({ data: { results: [{ id: 2, monthly_limit: null }] } });
    expect(await getBudgetCategories()).toEqual([{ id: 2, monthly_limit: 0 }]);
  });

  it('повертає порожній масив, якщо даних немає', async () => {
    apiClient.get.mockResolvedValueOnce({ data: {} });
    expect(await getBudgetCategories()).toEqual([]);
  });

  it('оновлення ліміту йде PATCH-ом і нормалізує число', async () => {
    apiClient.patch.mockResolvedValueOnce({ data: { id: 3, monthly_limit: '500.00' } });
    const res = await updateBudgetCategory(3, { monthly_limit: 500 });
    expect(apiClient.patch).toHaveBeenCalledWith('/budget/categories/3/', { monthly_limit: 500 }, TIMEOUT);
    expect(res.monthly_limit).toBe(500);
  });
});

describe('records', () => {
  it('передає параметри фільтра і перетворює суму на число', async () => {
    apiClient.get.mockResolvedValueOnce({ data: [{ id: 1, amount: '99.90' }] });
    const res = await getBudgetRecords({ month: '2026-11' });
    expect(apiClient.get).toHaveBeenCalledWith('/budget/records/', { params: { month: '2026-11' }, ...TIMEOUT });
    expect(res[0].amount).toBe(99.9);
  });

  it('createBudgetRecord відправляє лише потрібні поля й порожній опис за замовчуванням', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { id: 5, amount: '10.00' } });
    await createBudgetRecord({ type: 'expense', amount: 10, category_id: 2, date: '2026-11-01', extra: 'x' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/budget/records/',
      { type: 'expense', amount: 10, category_id: 2, date: '2026-11-01', description: '' },
      TIMEOUT
    );
  });
});

describe('summary', () => {
  it('нормалізує всі суми, включно з розбивкою за категоріями', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { month: '2026-11', income: '100.00', expense: '40.50', balance: '59.50', by_category: [{ category_id: 1, total: '40.50', percent: 100 }] },
    });
    const s = await getBudgetSummary('2026-11');
    expect(apiClient.get).toHaveBeenCalledWith('/budget/summary/', { params: { month: '2026-11' }, ...TIMEOUT });
    expect([s.income, s.expense, s.balance, s.by_category[0].total]).toEqual([100, 40.5, 59.5, 40.5]);
  });

  it('не падає без by_category', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { income: 0, expense: 0, balance: 0 } });
    expect((await getBudgetSummary('2026-11')).by_category).toEqual([]);
  });
});

describe('shopping', () => {
  it('getShoppingLists повертає масив із пагінованої відповіді', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { results: [{ id: 1, items: [] }] } });
    expect(await getShoppingLists()).toEqual([{ id: 1, items: [] }]);
  });

  it('createShoppingList відправляє title', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { id: 1, title: 'Market' } });
    await createShoppingList('Market');
    expect(apiClient.post).toHaveBeenCalledWith('/budget/shopping-lists/', { title: 'Market' }, TIMEOUT);
  });

  it('createShoppingItem за замовчуванням має кількість 1, а вказана кількість передається', async () => {
    apiClient.post.mockResolvedValue({ data: {} });
    await createShoppingItem(7, 'Tomato');
    expect(apiClient.post).toHaveBeenLastCalledWith('/budget/shopping-items/', { list_id: 7, name: 'Tomato', quantity: 1 }, TIMEOUT);
    await createShoppingItem(7, 'Tomato', 4);
    expect(apiClient.post).toHaveBeenLastCalledWith('/budget/shopping-items/', { list_id: 7, name: 'Tomato', quantity: 4 }, TIMEOUT);
  });

  it('позначення купленим і видалення позиції', async () => {
    apiClient.patch.mockResolvedValueOnce({ data: { id: 9, is_purchased: true } });
    await setShoppingItemPurchased(9, true);
    expect(apiClient.patch).toHaveBeenCalledWith('/budget/shopping-items/9/', { is_purchased: true }, TIMEOUT);
    apiClient.delete.mockResolvedValueOnce({});
    await deleteShoppingItem(9);
    expect(apiClient.delete).toHaveBeenCalledWith('/budget/shopping-items/9/', TIMEOUT);
  });
});
