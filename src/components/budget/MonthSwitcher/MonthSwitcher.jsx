import { UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';
import { monthLabel } from '../budgetUtils';

export default function MonthSwitcher({ date, onChange }) {
  const shift = (delta) => onChange(new Date(date.getFullYear(), date.getMonth() + delta, 1));
  return (
    <div className="b-pill month-switcher">
      <button type="button" className="b-icon-btn" onClick={() => shift(-1)} aria-label="Previous month">
        <UilAngleLeft size="16" />
      </button>
      <span className="month-switcher__label">{monthLabel(date)}</span>
      <button type="button" className="b-icon-btn" onClick={() => shift(1)} aria-label="Next month">
        <UilAngleRight size="16" />
      </button>
    </div>
  );
}
