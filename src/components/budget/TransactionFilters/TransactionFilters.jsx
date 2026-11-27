import { UilCalendarAlt } from '@iconscout/react-unicons';
import { monthLabel } from '../budgetUtils';
import Dropdown from '../ui/Dropdown';

const TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

export const DEFAULT_FILTERS = { type: 'all', category_id: 'all', dates: 'month' };

export default function TransactionFilters({ filters, onChange, categories, date }) {
  const set = (field) => (value) => onChange({ ...filters, [field]: value });
  return (
    <div className="tx-filters">
      <Dropdown ariaLabel="Type" value={filters.type} options={TYPES} onChange={set('type')} />
      <Dropdown
        ariaLabel="Category"
        value={filters.category_id}
        options={[{ value: 'all', label: 'All Categories' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
        onChange={set('category_id')}
      />
      <Dropdown
        ariaLabel="Dates"
        icon={<UilCalendarAlt size="14" />}
        value={filters.dates}
        options={[{ value: 'month', label: monthLabel(date) }, { value: 'all', label: 'All dates' }]}
        onChange={set('dates')}
      />
      <button type="button" className="b-link" onClick={() => onChange(DEFAULT_FILTERS)}>Reset</button>
    </div>
  );
}
