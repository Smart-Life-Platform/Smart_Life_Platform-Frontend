import { formatMoney } from '../budgetUtils';

export default function BudgetOverview({ income, expense }) {
  const balance = income - expense;
  return (
    <div className="b-stats">
      <div className="b-card b-stat">
        <span className="b-stat__label">Balance</span>
        <strong className={`b-stat__value ${balance < 0 ? 'is-negative' : ''}`}>{formatMoney(balance)}</strong>
      </div>
      <div className="b-card b-stat">
        <span className="b-stat__label">Expenses</span>
        <strong className="b-stat__value">{formatMoney(expense)}</strong>
      </div>
      <div className="b-card b-stat">
        <span className="b-stat__label">Revenue</span>
        <strong className="b-stat__value">{formatMoney(income)}</strong>
      </div>
    </div>
  );
}
