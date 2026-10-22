import { formatMoney } from '../budgetUtils';

// items: [{ category, total }] — витрати за місяць; ліміт береться з category.monthly_limit
export default function BudgetLimits({ items, categories }) {
  const rows = categories
    .filter((c) => c.type === 'expense' && c.monthly_limit > 0)
    .map((c) => {
      const spent = items.find((i) => i.category.id === c.id)?.total || 0;
      return { c, spent, ratio: spent / c.monthly_limit };
    });

  return (
    <ul className="limits">
      {rows.map(({ c, spent, ratio }) => (
        <li key={c.id}>
          <div className="cat-list__row">
            <span>{c.name}</span>
            <span>{formatMoney(spent)} / {formatMoney(c.monthly_limit)}</span>
          </div>
          <div className="progress">
            <div
              className={`progress__bar ${ratio > 1 ? 'is-over' : ratio > 0.8 ? 'is-warn' : ''}`}
              style={{ width: `${Math.min(ratio, 1) * 100}%` }}
            />
          </div>
          {ratio > 1 && <small className="form-error">Ліміт перевищено</small>}
        </li>
      ))}
    </ul>
  );
}
