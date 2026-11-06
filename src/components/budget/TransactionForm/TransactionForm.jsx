import { useState } from 'react';
import { UilPlus } from '@iconscout/react-unicons';

const empty = () => ({
  type: 'expense',
  amount: '',
  category_id: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
});

export default function TransactionForm({ categories, accountId, onAdd }) {
  const [form, setForm] = useState(empty());
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const options = categories.filter((c) => c.type === form.type);

  const submit = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError('Enter an amount greater than 0');
    if (!form.category_id) return setError('Select a category');
    setError('');
    onAdd({
      ...form,
      amount,
      category_id: Number(form.category_id),
      id: Date.now(),
      account_id: accountId === 'all' ? 'card' : accountId,
    });
    setForm(empty());
  };

  return (
    <form className="tx-form" onSubmit={submit}>
      <div className="b-segmented">
        {[['expense', 'Expense'], ['income', 'Income']].map(([t, label]) => (
          <button
            key={t}
            type="button"
            className={form.type === t ? 'is-active' : ''}
            onClick={() => setForm({ ...form, type: t, category_id: '' })}
          >
            {label}
          </button>
        ))}
      </div>

      <label>Amount, ₴
        <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
      </label>
      <label>Category
        <select value={form.category_id} onChange={set('category_id')}>
          <option value="">Select…</option>
          {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>Date
        <input type="date" value={form.date} onChange={set('date')} />
      </label>
      <label>Note
        <textarea value={form.description} onChange={set('description')} maxLength={120} placeholder="Add a note..." rows={3} />
      </label>

      {error && <p className="b-error">{error}</p>}
      <button type="submit" className="b-btn-primary"><UilPlus size="14" /> Add</button>
    </form>
  );
}
