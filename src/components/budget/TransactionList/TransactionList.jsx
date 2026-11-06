import { UilTrashAlt } from '@iconscout/react-unicons';
import { getIcon } from '../icons';
import { formatMoney, formatDate } from '../budgetUtils';

export default function TransactionList({ records, categories, onDelete }) {
  if (!records.length) return <p className="b-empty">No transactions found</p>;
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <ul className="tx-list">
      {sorted.map((r) => {
        const cat = categories.find((c) => c.id === r.category_id);
        const Icon = getIcon(cat?.icon);
        return (
          <li key={r.id} className="tx-list__item">
            <span className="b-icon-circle" style={{ color: cat?.color }}>
              <Icon size="15" />
            </span>
            <div className="tx-list__info">
              <strong>{cat?.name}</strong>
              <small>{r.description ? `${r.description} · ` : ''}{formatDate(r.date)}</small>
            </div>
            <span className={`tx-list__amount ${r.type === 'income' ? 'is-income' : 'is-expense'}`}>
              {r.type === 'income' ? '+' : '−'}{formatMoney(r.amount)}
            </span>
            <button type="button" className="b-icon-btn" onClick={() => onDelete(r.id)} aria-label="Delete">
              <UilTrashAlt size="15" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
