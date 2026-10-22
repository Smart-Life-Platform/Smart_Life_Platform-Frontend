export default function TransactionFilters({ filters, onChange, categories }) {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });
  return (
    <div className="tx-filters">
      <select value={filters.type} onChange={set('type')}>
        <option value="all">Всі типи</option>
        <option value="expense">Витрати</option>
        <option value="income">Доходи</option>
      </select>
      <select value={filters.category_id} onChange={set('category_id')}>
        <option value="all">Всі категорії</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input type="date" value={filters.date} onChange={set('date')} />
      <button type="button" className="btn-link" onClick={() => onChange({ type: 'all', category_id: 'all', date: '' })}>
        Скинути
      </button>
    </div>
  );
}
