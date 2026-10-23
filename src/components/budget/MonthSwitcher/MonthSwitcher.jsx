import { UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';
import { monthLabel } from '../budgetUtils';

export default function MonthSwitcher({ date, onChange }) {
  const shift = (delta) => onChange(new Date(date.getFullYear(), date.getMonth() + delta, 1));
  return (
    <div className="month-switcher">
      <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Попередній місяць">
        <UilAngleLeft size="22" />
      </button>
      <span className="month-switcher__label">{monthLabel(date)}</span>
      <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Наступний місяць">
        <UilAngleRight size="22" />
      </button>
    </div>
  );
}
