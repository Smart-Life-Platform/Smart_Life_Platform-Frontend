import { UilCalendarAlt } from '@iconscout/react-unicons';
import { monthKey, monthLabel } from '../budgetUtils';

// months — масив Date (місяці, які можна вибрати); date — поточний місяць сторінки
export default function TransactionFilters({ filters, onChange, categories, months, date, onDateChange }) {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });
  return (
    <div className="tx-filters">
      <select value={filters.type} onChange={set('type')} aria-label="Type">
        <option value="all">All Types</option>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <select value={filters.category_id} onChange={set('category_id')} aria-label="Category">
        <option value="all">All Categories</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="tx-filters__month">
        <UilCalendarAlt size="14" />
        <select
          value={monthKey(date)}
          onChange={(e) => onDateChange(months.find((m) => monthKey(m) === e.target.value))}
          aria-label="Month"
        >
          {months.map((m) => <option key={monthKey(m)} value={monthKey(m)}>{monthLabel(m)}</option>)}
        </select>
      </div>
      <button type="button" className="b-link" onClick={() => onChange({ type: 'all', category_id: 'all' })}>
        Reset
      </button>
    </div>
  );
}
