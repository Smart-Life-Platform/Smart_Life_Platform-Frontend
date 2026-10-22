import { useMemo, useState } from 'react';
import '../styles/budget.css';
import { accounts, categories as initialCategories, records as initialRecords, shoppingLists as initialLists } from '../components/budget/mockData';
import { filterByMonthAndAccount, sumByType, expensesByCategory } from '../components/budget/budgetUtils';
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
  ['overview', 'Огляд'],
  ['transactions', 'Транзакції'],
  ['shopping', 'Покупки'],
  ['limits', 'Ліміти'],
];

export default function BudgetPage() {
  const [tab, setTab] = useState('overview');
  const [date, setDate] = useState(new Date(2026, 9, 1));
  const [accountId, setAccountId] = useState('all');
  const [records, setRecords] = useState(initialRecords);
  const [categories, setCategories] = useState(initialCategories);
  const [lists, setLists] = useState(initialLists);
  const [filters, setFilters] = useState({ type: 'all', category_id: 'all', date: '' });

  const monthRecords = useMemo(() => filterByMonthAndAccount(records, date, accountId), [records, date, accountId]);
  const income = sumByType(monthRecords, 'income');
  const expense = sumByType(monthRecords, 'expense');
  const byCategory = useMemo(() => expensesByCategory(monthRecords, categories), [monthRecords, categories]);

  const visibleRecords = monthRecords.filter(
    (r) =>
      (filters.type === 'all' || r.type === filters.type) &&
      (filters.category_id === 'all' || r.category_id === Number(filters.category_id)) &&
      (!filters.date || r.date === filters.date)
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
      <h1>Бюджет і покупки</h1>

      <div className="budget-toolbar">
        <MonthSwitcher date={date} onChange={setDate} />
        <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} />
      </div>

      <nav className="budget-tabs">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <>
          <BudgetOverview income={income} expense={expense} />
          <div className="budget-grid">
            <ExpensesChart items={byCategory} />
            <CategoryExpenses items={byCategory} />
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <div className="budget-grid">
          <TransactionForm categories={categories} accountId={accountId} onAdd={(r) => setRecords([r, ...records])} />
          <div>
            <TransactionFilters filters={filters} onChange={setFilters} categories={categories} />
            <TransactionList
              records={visibleRecords}
              categories={categories}
              onDelete={(id) => setRecords(records.filter((r) => r.id !== id))}
            />
          </div>
        </div>
      )}

      {tab === 'shopping' && (
        <ShoppingList lists={lists} onToggle={toggleItem} onAddItem={addItem} onDeleteItem={deleteItem} />
      )}

      {tab === 'limits' && (
        <div className="budget-grid">
          <BudgetLimits items={byCategory} categories={categories} />
          <LimitsSettings
            categories={categories}
            onChange={(id, v) => setCategories(categories.map((c) => c.id === id ? { ...c, monthly_limit: v } : c))}
          />
        </div>
      )}
    </div>
  );
}
