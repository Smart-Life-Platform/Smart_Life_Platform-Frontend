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
    if (!(amount > 0)) return setError('Вкажіть суму більше 0');
    if (!form.category_id) return setError('Оберіть категорію');
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
      <div className="segmented">
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            type="button"
            className={form.type === t ? 'is-active' : ''}
            onClick={() => setForm({ ...form, type: t, category_id: '' })}
          >
            {t === 'expense' ? 'Витрата' : 'Дохід'}
          </button>
        ))}
      </div>

      <label>Сума, ₴
        <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
      </label>
      <label>Категорія
        <select value={form.category_id} onChange={set('category_id')}>
          <option value="">Оберіть…</option>
          {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>Дата
        <input type="date" value={form.date} onChange={set('date')} />
      </label>
      <label>Примітка
        <input type="text" value={form.description} onChange={set('description')} maxLength={120} />
      </label>

      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary"><UilPlus size="18" /> Додати</button>
    </form>
  );
}
