import { useMemo, useState } from 'react';
import '../styles/budget.css';
import { accounts, categories as initialCategories, records as initialRecords, shoppingLists as initialLists } from '../components/budget/mockData';
import { filterByMonthAndAccount, sumByType, expensesByCategory, monthKey, monthLabel } from '../components/budget/budgetUtils';
import MonthSwitcher from '../components/budget/MonthSwitcher/MonthSwitcher';
import AccountSelect from '../components/budget/AccountSelect/AccountSelect';
import BudgetOverview from '../components/budget/BudgetOverview/BudgetOverview';
import CategoryExpenses from '../components/budget/CategoryExpenses/CategoryExpenses';
import ExpensesChart from '../components/budget/ExpensesChart/ExpensesChart';
import TransactionForm from '../components/budget/TransactionForm/TransactionForm';
import TransactionFilters from '../components/budget/TransactionFilters/TransactionFilters';
import TransactionList from '../components/budget/TransactionList/TransactionList';
import BudgetLimits from '../components/budget/BudgetLimits/BudgetLimits';
import LimitsSettings from '../components/budget/LimitsSettings/LimitsSettings';
import ShoppingList from '../components/budget/ShoppingList/ShoppingList';

const TABS = [
  ['overview', 'Overview'],
  ['transactions', 'Transactions'],
  ['shopping', 'Shopping'],
  ['limits', 'Limits'],
];

export default function BudgetPage() {
  // Поки що все в локальному стані. Коли буде бекенд — замінити на запити (src/api/budgetApi.js).
  const [tab, setTab] = useState('overview');
  const [date, setDate] = useState(new Date(2026, 9, 1));
  const [accountId, setAccountId] = useState('all');
  const [records, setRecords] = useState(initialRecords);
  const [categories, setCategories] = useState(initialCategories);
  const [lists, setLists] = useState(initialLists);
  const [filters, setFilters] = useState({ type: 'all', category_id: 'all' });

  const monthRecords = useMemo(() => filterByMonthAndAccount(records, date, accountId), [records, date, accountId]);
  const income = sumByType(monthRecords, 'income');
  const expense = sumByType(monthRecords, 'expense');
  const byCategory = useMemo(() => expensesByCategory(monthRecords, categories), [monthRecords, categories]);

  // місяці для випадаючого списку в фільтрах: ті, де є записи, + поточний вибраний
  const months = useMemo(() => {
    const keys = new Set([...records.map((r) => r.date.slice(0, 7)), monthKey(date)]);
    return [...keys].sort().reverse().map((k) => new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1));
  }, [records, date]);

  const visibleRecords = monthRecords.filter(
    (r) =>
      (filters.type === 'all' || r.type === filters.type) &&
      (filters.category_id === 'all' || r.category_id === Number(filters.category_id))
  );

  const toggleItem = (listId, itemId) =>
    setLists(lists.map((l) => l.id !== listId ? l : {
      ...l, items: l.items.map((i) => i.id === itemId ? { ...i, is_purchased: !i.is_purchased } : i),
    }));
  const addItem = (listId, name) =>
    setLists(lists.map((l) => l.id !== listId ? l : {
      ...l, items: [...l.items, { id: Date.now(), name, quantity: 1, is_purchased: false }],
    }));
  const deleteItem = (listId, itemId) =>
    setLists(lists.map((l) => l.id !== listId ? l : { ...l, items: l.items.filter((i) => i.id !== itemId) }));

  return (
    <div className="budget-page">
      <header className="budget-head">
        <div className="budget-head__row">
          <h1>Budget and Shopping</h1>
          <div className="budget-toolbar">
            <MonthSwitcher date={date} onChange={setDate} />
            <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} />
          </div>
        </div>
        <nav className="budget-tabs" aria-label="Budget sections">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="budget-body">
        {tab === 'overview' && (
          <>
            <BudgetOverview income={income} expense={expense} />
            <div className="budget-grid budget-grid--overview">
              <section className="b-card">
                <h3 className="b-card__title">Expenses by Category</h3>
                <ExpensesChart items={byCategory} total={expense} caption={monthLabel(date)} />
              </section>
              <section className="b-card">
                <div className="b-card__head">
                  <h3 className="b-card__title">Expense Categories</h3>
                  <small>Per month</small>
                </div>
                <CategoryExpenses items={byCategory} />
              </section>
            </div>
          </>
        )}

        {tab === 'transactions' && (
          <div className="budget-grid budget-grid--transactions">
            <section className="b-card">
              <h3 className="b-card__title">Add a transaction</h3>
              <TransactionForm categories={categories} accountId={accountId} onAdd={(r) => setRecords([r, ...records])} />
            </section>
            <section className="b-card">
              <div className="b-card__head">
                <h3 className="b-card__title">Transaction History</h3>
                <small>{visibleRecords.length} Transactions</small>
              </div>
              <TransactionFilters
                filters={filters}
                onChange={setFilters}
                categories={categories}
                months={months}
                date={date}
                onDateChange={setDate}
              />
              <TransactionList
                records={visibleRecords}
                categories={categories}
                onDelete={(id) => setRecords(records.filter((r) => r.id !== id))}
              />
            </section>
          </div>
        )}

        {tab === 'shopping' && (
          <ShoppingList lists={lists} onToggle={toggleItem} onAddItem={addItem} onDeleteItem={deleteItem} />
        )}

        {tab === 'limits' && (
          <div className="budget-grid budget-grid--limits">
            <section className="b-card">
              <h3 className="b-card__title">Budget limits</h3>
              <BudgetLimits items={byCategory} categories={categories} />
            </section>
            <section className="b-card">
              <h3 className="b-card__title">Set monthly limits</h3>
              <LimitsSettings
                categories={categories}
                onChange={(id, v) => setCategories(categories.map((c) => c.id === id ? { ...c, monthly_limit: v } : c))}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
