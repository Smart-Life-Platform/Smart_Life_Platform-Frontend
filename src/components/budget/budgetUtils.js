const MONTH_SUFFIX = ' р.';

export const formatMoney = (n) =>
  `${Number(n).toLocaleString('uk-UA', { maximumFractionDigits: 2 })} ₴`;

export const monthKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const monthLabel = (d) =>
  `${d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}${MONTH_SUFFIX}`;

export const formatDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

export const filterByMonthAndAccount = (records, date, accountId) =>
  records.filter(
    (r) => r.date.startsWith(monthKey(date)) && (accountId === 'all' || r.account_id === accountId)
  );

export const sumByType = (records, type) =>
  records.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0);

// [{ category, total, percent }] для витрат, від більшого до меншого
export const expensesByCategory = (records, categories) => {
  const totals = new Map();
  let total = 0;
  for (const record of records) {
    if (record.type !== 'expense') continue;
    total += record.amount;
    totals.set(record.category_id, (totals.get(record.category_id) || 0) + record.amount);
  }
  return categories
    .filter((c) => c.type === 'expense')
    .map((category) => {
      const sum = totals.get(category.id) || 0;
      return { category, total: sum, percent: total ? Math.round((sum / total) * 100) : 0 };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
};
