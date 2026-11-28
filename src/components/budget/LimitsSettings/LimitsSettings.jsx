import { useState } from 'react';
import Modal from '../ui/Modal';
import { formatMoney } from '../budgetUtils';

function LimitDialog({ category, spent, onSave, onClose }) {
  const [amount, setAmount] = useState(String(category.monthly_limit));
  const [saving, setSaving] = useState(false);
  const value = Number(amount);
  const valid = amount !== '' && value >= 0;
  const remaining = value - spent;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const ok = await onSave(category.id, value);
    setSaving(false);
    if (ok !== false) onClose();
  };

  return (
    <Modal title="Edit limit" onClose={onClose}>
      <form onSubmit={submit} className="b-dialog__form">
        <div className="b-dialog__summary">
          <strong>{category.name}</strong>
          <span>Current limit <b>{formatMoney(category.monthly_limit)}</b></span>
        </div>
        <label>Amount, ₴
          <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </label>
        {valid && value > 0 && (
          <small className={remaining < 0 ? 'b-error' : 'b-dialog__hint'}>
            {remaining < 0 ? `${formatMoney(-remaining)} over the limit` : `${formatMoney(remaining)} remaining`}
          </small>
        )}
        {valid && value === 0 && <small className="b-dialog__hint">No limit</small>}
        {!valid && <small className="b-error">Enter an amount of 0 or more</small>}
        <div className="b-dialog__actions">
          <button type="button" className="b-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="b-btn-primary" disabled={!valid || saving}>Save</button>
        </div>
      </form>
    </Modal>
  );
}

export default function LimitsSettings({ categories, items = [], onChange }) {
  const [editing, setEditing] = useState(null);
  const expense = categories.filter((c) => c.type === 'expense');
  const spentOf = (c) => items.find((i) => i.category.id === c.id)?.total || 0;

  return (
    <div className="limits-settings">
      {expense.map((c) => (
        <div key={c.id} className="limits-settings__row">
          <span>{c.name}</span>
          <button type="button" className="limits-settings__value" onClick={() => setEditing(c)} aria-label={`Edit limit: ${c.name}`}>
            {c.monthly_limit}
          </button>
        </div>
      ))}
      {editing && (
        <LimitDialog category={editing} spent={spentOf(editing)} onSave={onChange} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
