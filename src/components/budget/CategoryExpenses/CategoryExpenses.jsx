import { getIcon } from '../icons';
import { formatMoney } from '../budgetUtils';

export default function CategoryExpenses({ items }) {
  if (!items.length) return <p className="empty">Немає витрат за цей період</p>;
  return (
    <ul className="cat-list">
      {items.map(({ category, total, percent }) => {
        const Icon = getIcon(category.icon);
        return (
          <li key={category.id} className="cat-list__item">
            <span className="cat-list__icon" style={{ background: category.color }}>
              <Icon size="20" color="#fff" />
            </span>
            <div className="cat-list__body">
              <div className="cat-list__row">
                <span>{category.name}</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <div className="progress">
                <div className="progress__bar" style={{ width: `${percent}%`, background: category.color }} />
              </div>
              <small>{percent}%</small>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
