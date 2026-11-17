import { apiClient } from './apiClient';

const list = (data) => (Array.isArray(data) ? data : data?.results || []);

const normalizeCategory = (c) => ({ ...c, monthly_limit: Number(c.monthly_limit || 0) });
const normalizeRecord = (r) => ({ ...r, amount: Number(r.amount) });
const normalizeSummary = (s) => ({
  ...s,
  income: Number(s.income),
  expense: Number(s.expense),
  balance: Number(s.balance),
  by_category: (s.by_category || []).map((x) => ({ ...x, total: Number(x.total) })),
});

export const getBudgetCategories = () =>
  apiClient.get('/budget/categories/').then((r) => list(r.data).map(normalizeCategory));
export const createBudgetCategory = (payload) =>
  apiClient.post('/budget/categories/', payload).then((r) => normalizeCategory(r.data));
export const updateBudgetCategory = (id, payload) =>
  apiClient.patch(`/budget/categories/${id}/`, payload).then((r) => normalizeCategory(r.data));
export const deleteBudgetCategory = (id) => apiClient.delete(`/budget/categories/${id}/`);


export const getBudgetRecords = (params = {}) =>
  apiClient.get('/budget/records/', { params }).then((r) => list(r.data).map(normalizeRecord));
export const createBudgetRecord = ({ type, amount, category_id, date, description }) =>
  apiClient
    .post('/budget/records/', { type, amount, category_id, date, description: description || '' })
    .then((r) => normalizeRecord(r.data));
export const updateBudgetRecord = (id, payload) =>
  apiClient.patch(`/budget/records/${id}/`, payload).then((r) => normalizeRecord(r.data));
export const deleteBudgetRecord = (id) => apiClient.delete(`/budget/records/${id}/`);

export const getBudgetSummary = (month) =>
  apiClient.get('/budget/summary/', { params: { month } }).then((r) => normalizeSummary(r.data));

export const getShoppingLists = () => apiClient.get('/budget/shopping-lists/').then((r) => list(r.data));
export const createShoppingList = (title) =>
  apiClient.post('/budget/shopping-lists/', { title }).then((r) => r.data);
export const deleteShoppingList = (id) => apiClient.delete(`/budget/shopping-lists/${id}/`);
export const createShoppingItem = (listId, name, quantity = 1) =>
  apiClient.post('/budget/shopping-items/', { list_id: listId, name, quantity }).then((r) => r.data);
export const setShoppingItemPurchased = (itemId, isPurchased) =>
  apiClient.patch(`/budget/shopping-items/${itemId}/`, { is_purchased: isPurchased }).then((r) => r.data);
export const deleteShoppingItem = (itemId) => apiClient.delete(`/budget/shopping-items/${itemId}/`);
