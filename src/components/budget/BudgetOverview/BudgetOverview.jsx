import { formatMoney } from '../budgetUtils';

export default function BudgetOverview({ income, expense }) {
  const balance = income - expense;
  return (
    <div className="overview">
      <div className="overview__card">
        <span className="overview__label">Баланс</span>
        <strong className={`overview__value ${balance < 0 ? 'is-negative' : ''}`}>{formatMoney(balance)}</strong>
      </div>
      <div className="overview__card">
        <span className="overview__label">Витрати</span>
        <strong className="overview__value is-expense">{formatMoney(expense)}</strong>
      </div>
      <div className="overview__card">
        <span className="overview__label">Доходи</span>
        <strong className="overview__value is-income">{formatMoney(income)}</strong>
      </div>
    </div>
  );
}
