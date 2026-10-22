import { UilTrashAlt } from '@iconscout/react-unicons';
import { getIcon } from '../icons';
import { formatMoney } from '../budgetUtils';

export default function TransactionList({ records, categories, onDelete }) {
  if (!records.length) return <p className="empty">Транзакцій не знайдено</p>;
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <ul className="tx-list">
      {sorted.map((r) => {
        const cat = categories.find((c) => c.id === r.category_id);
        const Icon = getIcon(cat?.icon);
        return (
          <li key={r.id} className="tx-list__item">
            <span className="cat-list__icon" style={{ background: cat?.color }}>
              <Icon size="20" color="#fff" />
            </span>
            <div className="tx-list__info">
              <strong>{cat?.name}</strong>
              <small>{r.description || '—'} · {r.date}</small>
            </div>
            <span className={r.type === 'income' ? 'is-income' : 'is-expense'}>
              {r.type === 'income' ? '+' : '−'}{formatMoney(r.amount)}
            </span>
            <button type="button" className="icon-btn" onClick={() => onDelete(r.id)} aria-label="Видалити">
              <UilTrashAlt size="18" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
