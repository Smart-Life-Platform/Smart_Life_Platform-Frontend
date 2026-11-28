import { useState } from 'react';
import { UilPlus } from '@iconscout/react-unicons';
import Dropdown from '../ui/Dropdown';
import DatePicker, { todayIso } from '../ui/DatePicker';

const empty = () => ({ type: 'expense', amount: '', category_id: '', date: todayIso(), description: '' });

export default function TransactionForm({ categories, accountId, onAdd }) {
  const [form, setForm] = useState(empty());
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const options = categories.filter((c) => c.type === form.type).map((c) => ({ value: c.id, label: c.name }));

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!(amount > 0)) return setError('Enter an amount greater than 0');
    if (!form.category_id) return setError('Select a category');
    setError('');
    const ok = await onAdd({
      ...form,
      amount,
      category_id: Number(form.category_id),
      account_id: accountId === 'all' ? 'card' : accountId,
    });
    if (ok !== false) setForm(empty()); // при помилці API поля не чистимо
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
      <div className="tx-form__field">
        <span>Category</span>
        <Dropdown
          variant="field"
          ariaLabel="Category"
          value={form.category_id}
          options={options}
          onChange={(id) => setForm({ ...form, category_id: id })}
        />
      </div>
      <div className="tx-form__field">
        <span>Date</span>
        <DatePicker value={form.date} onChange={(date) => setForm({ ...form, date })} />
      </div>
      <label>Note
        <textarea value={form.description} onChange={set('description')} maxLength={120} placeholder="Add a note..." rows={3} />
      </label>

      {error && <p className="b-error">{error}</p>}
      <button type="submit" className="b-btn-primary"><UilPlus size="14" /> Save</button>
    </form>
  );
}
