import { apiClient } from './apiClient';

const SLOW = { timeout: 45000 };

const list = (data) => (Array.isArray(data) ? data : data?.results || []);

const normalizeCategory = (c) => ({ ...c, monthly_limit: Number(c.monthly_limit || 0) });
const normalizeItem = (i) => ({ ...i, quantity: Number(i.quantity ?? 1), unit: i.unit || 'pcs' });
const normalizeShoppingList = (l) => ({ ...l, items: (l.items || []).map(normalizeItem) });
const normalizeRecord = (r) => ({ ...r, amount: Number(r.amount) });
const normalizeSummary = (s) => ({
  ...s,
  income: Number(s.income),
  expense: Number(s.expense),
  balance: Number(s.balance),
  by_category: (s.by_category || []).map((x) => ({ ...x, total: Number(x.total) })),
});

export const getBudgetCategories = () =>
  apiClient.get('/budget/categories/', SLOW).then((r) => list(r.data).map(normalizeCategory));
export const createBudgetCategory = (payload) =>
  apiClient.post('/budget/categories/', payload, SLOW).then((r) => normalizeCategory(r.data));
export const updateBudgetCategory = (id, payload) =>
  apiClient.patch(`/budget/categories/${id}/`, payload, SLOW).then((r) => normalizeCategory(r.data));
export const deleteBudgetCategory = (id) => apiClient.delete(`/budget/categories/${id}/`, SLOW);


export const getBudgetRecords = (params = {}) =>
  apiClient.get('/budget/records/', { params, ...SLOW }).then((r) => list(r.data).map(normalizeRecord));
export const createBudgetRecord = ({ type, amount, category_id, date, description }) =>
  apiClient
    .post('/budget/records/', { type, amount, category_id, date, description: description || '' }, SLOW)
    .then((r) => normalizeRecord(r.data));
export const updateBudgetRecord = (id, payload) =>
  apiClient.patch(`/budget/records/${id}/`, payload, SLOW).then((r) => normalizeRecord(r.data));
export const deleteBudgetRecord = (id) => apiClient.delete(`/budget/records/${id}/`, SLOW);

export const getBudgetSummary = (month) =>
  apiClient.get('/budget/summary/', { params: { month }, ...SLOW }).then((r) => normalizeSummary(r.data));

export const getShoppingLists = () =>
  apiClient.get('/budget/shopping-lists/', SLOW).then((r) => list(r.data).map(normalizeShoppingList));
export const createShoppingList = (title) =>
  apiClient.post('/budget/shopping-lists/', { title }, SLOW).then((r) => normalizeShoppingList(r.data));
export const deleteShoppingList = (id) => apiClient.delete(`/budget/shopping-lists/${id}/`, SLOW);
export const createShoppingItem = (listId, { name, quantity = 1, unit = 'pcs' }) =>
  apiClient.post('/budget/shopping-items/', { list_id: listId, name, quantity, unit }, SLOW).then((r) => normalizeItem(r.data));
export const updateShoppingItem = (itemId, payload) =>
  apiClient.patch(`/budget/shopping-items/${itemId}/`, payload, SLOW).then((r) => normalizeItem(r.data));
export const setShoppingItemPurchased = (itemId, isPurchased) => updateShoppingItem(itemId, { is_purchased: isPurchased });
export const deleteShoppingItem = (itemId) => apiClient.delete(`/budget/shopping-items/${itemId}/`, SLOW);
