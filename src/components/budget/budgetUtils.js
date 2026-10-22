export const formatMoney = (n) =>
  `${Number(n).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴`;

export const monthKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const monthLabel = (d) =>
  d.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });

export const filterByMonthAndAccount = (records, date, accountId) =>
  records.filter(
    (r) => r.date.startsWith(monthKey(date)) && (accountId === 'all' || r.account_id === accountId)
  );

export const sumByType = (records, type) =>
  records.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0);

// [{ category, total, percent }] для витрат, від більшого до меншого
export const expensesByCategory = (records, categories) => {
  const expenses = records.filter((r) => r.type === 'expense');
  const total = expenses.reduce((s, r) => s + r.amount, 0);
  return categories
    .filter((c) => c.type === 'expense')
    .map((category) => {
      const sum = expenses.filter((r) => r.category_id === category.id).reduce((s, r) => s + r.amount, 0);
      return { category, total: sum, percent: total ? Math.round((sum / total) * 100) : 0 };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
};
