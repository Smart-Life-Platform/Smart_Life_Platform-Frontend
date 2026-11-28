import { UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';
import { monthKey, monthLabel } from '../budgetUtils';
import Dropdown from '../ui/Dropdown';

export default function MonthSwitcher({ date, onChange }) {
  const shift = (delta) => onChange(new Date(date.getFullYear(), date.getMonth() + delta, 1));
  const year = date.getFullYear();
  const options = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return { value: monthKey(d), label: monthLabel(d) };
  });

  return (
    <div className="b-pill month-switcher">
      <button type="button" className="b-icon-btn" onClick={() => shift(-1)} aria-label="Previous month">
        <UilAngleLeft size="16" />
      </button>
      <Dropdown
        variant="plain"
        align="center"
        ariaLabel="Choose month"
        value={monthKey(date)}
        options={options}
        onChange={(key) => onChange(new Date(year, Number(key.slice(5)) - 1, 1))}
        className="month-switcher__label"
      />
      <button type="button" className="b-icon-btn" onClick={() => shift(1)} aria-label="Next month">
        <UilAngleRight size="16" />
      </button>
    </div>
  );
}
