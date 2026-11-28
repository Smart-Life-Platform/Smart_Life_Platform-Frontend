import { useState } from 'react';
import { UilTrashAlt } from '@iconscout/react-unicons';
import { getIcon } from '../icons';
import { formatMoney, formatDate } from '../budgetUtils';
import Modal from '../ui/Modal';

export default function TransactionList({ records, categories, onDelete }) {
  const [target, setTarget] = useState(null); // запис, який користувач збирається видалити
  const categoryOf = (r) => categories.find((c) => c.id === r.category_id);

  if (!records.length) return <p className="b-empty">No transactions found</p>;
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  const confirm = async () => {
    const id = target.id;
    setTarget(null);
    await onDelete(id);
  };

  return (
    <>
      <ul className="tx-list">
        {sorted.map((r) => {
          const cat = categoryOf(r);
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
              <button type="button" className="b-icon-btn" onClick={() => setTarget(r)} aria-label="Delete">
                <UilTrashAlt size="15" />
              </button>
            </li>
          );
        })}
      </ul>

      {target && (
        <Modal title="Delete transaction?" onClose={() => setTarget(null)} className="b-dialog--confirm">
          <p className="b-dialog__text">{categoryOf(target)?.name}</p>
          <div className="b-dialog__actions">
            <button type="button" className="b-btn-secondary" onClick={() => setTarget(null)}>Cancel</button>
            <button type="button" className="b-btn-primary" onClick={confirm} autoFocus>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}
