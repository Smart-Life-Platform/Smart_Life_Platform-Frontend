import { useEffect, useMemo, useState } from 'react';
import '../styles/budget.css';
import '../styles/budget-api.css';
import { accounts } from '../components/budget/accounts';
import { monthKey, monthLabel } from '../components/budget/budgetUtils';
import {
  getBudgetCategories, updateBudgetCategory,
  getBudgetRecords, createBudgetRecord, deleteBudgetRecord, getBudgetSummary,
  getShoppingLists, createShoppingList, deleteShoppingList,
  createShoppingItem, setShoppingItemPurchased, deleteShoppingItem,
} from '../api/budgetApi';
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

// Останні 12 місяців (для випадаючого списку в фільтрах транзакцій) + вибраний місяць
function buildMonths(selected) {
  const now = new Date();
  const result = [];
  for (let i = 0; i < 12; i += 1) result.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  if (!result.some((m) => monthKey(m) === monthKey(selected))) result.push(selected);
  return result.sort((a, b) => b - a);
}

export default function BudgetPage() {
  const [tab, setTab] = useState('overview');
  const [date, setDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  // TODO: рахунків немає в ТЗ/API — фільтр поки лише в інтерфейсі (чекаємо рішення команди)
  const [accountId, setAccountId] = useState('all');
  const [filters, setFilters] = useState({ type: 'all', category_id: 'all' });

  const [categories, setCategories] = useState([]);
  const [lists, setLists] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  const [baseLoading, setBaseLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);
  const [error, setError] = useState('');
  const [baseKey, setBaseKey] = useState(0); // збільшуємо, щоб перезавантажити категорії й покупки
  const [monthReload, setMonthReload] = useState(0); // збільшуємо, щоб перезавантажити записи й підсумок

  const month = monthKey(date);

  // Категорії та списки покупок не залежать від місяця
  useEffect(() => {
    let cancelled = false;
    setBaseLoading(true);
    Promise.all([getBudgetCategories(), getShoppingLists()])
      .then(([cats, shopping]) => {
        if (cancelled) return;
        setCategories(cats);
        setLists(shopping);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setBaseLoading(false));
    return () => { cancelled = true; };
  }, [baseKey]);

  // Транзакції та підсумок — за вибраним місяцем
  useEffect(() => {
    let cancelled = false;
    setMonthLoading(true);
    Promise.all([getBudgetRecords({ month }), getBudgetSummary(month)])
      .then(([recs, sum]) => {
        if (cancelled) return;
        setRecords(recs);
        setSummary(sum);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setMonthLoading(false));
    return () => { cancelled = true; };
  }, [month, monthReload]);

  const retry = () => {
    setError('');
    setBaseKey((k) => k + 1);
    setMonthReload((k) => k + 1);
  };

  // Виконує запит; помилку показує в банері й повертає undefined
  const run = async (action) => {
    try {
      setError('');
      return await action();
    } catch (e) {
      setError(e.message);
      return undefined;
    }
  };

  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;
  const byCategory = useMemo(
    () =>
      (summary?.by_category || [])
        .map((x) => ({ category: categories.find((c) => c.id === x.category_id), total: x.total, percent: x.percent }))
        .filter((x) => x.category),
    [summary, categories]
  );
  const months = useMemo(() => buildMonths(date), [date]);

  const visibleRecords = records.filter(
    (r) =>
      (filters.type === 'all' || r.type === filters.type) &&
      (filters.category_id === 'all' || r.category_id === Number(filters.category_id))
  );

  // ----- транзакції -----
  const addRecord = async (record) => {
    const created = await run(() => createBudgetRecord(record));
    if (created) setMonthReload((k) => k + 1);
    return Boolean(created); // форма використовує це, щоб не очищати поля при помилці
  };
  const removeRecord = async (id) => {
    const done = await run(async () => { await deleteBudgetRecord(id); return true; });
    if (done) setMonthReload((k) => k + 1);
  };

  // ----- ліміти -----
  const saveLimit = async (id, value) => {
    const updated = await run(() => updateBudgetCategory(id, { monthly_limit: value }));
    if (updated) setCategories((cs) => cs.map((c) => (c.id === id ? updated : c)));
  };

  // ----- списки покупок -----
  const patchList = (listId, fn) => setLists((ls) => ls.map((l) => (l.id === listId ? fn(l) : l)));

  const addList = async (title) => {
    const created = await run(() => createShoppingList(title));
    if (created) setLists((ls) => [{ ...created, items: created.items || [] }, ...ls]);
  };
  const removeList = async (listId) => {
    const done = await run(async () => { await deleteShoppingList(listId); return true; });
    if (done) setLists((ls) => ls.filter((l) => l.id !== listId));
  };
  const addItem = async (listId, name, quantity = 1) => {
    const item = await run(() => createShoppingItem(listId, name, quantity));
    if (item) patchList(listId, (l) => ({ ...l, items: [...l.items, item] }));
  };
  const toggleItem = async (listId, itemId) => {
    const current = lists.find((l) => l.id === listId)?.items.find((i) => i.id === itemId);
    if (!current) return;
    const setPurchased = (value) =>
      patchList(listId, (l) => ({ ...l, items: l.items.map((i) => (i.id === itemId ? { ...i, is_purchased: value } : i)) }));
    setPurchased(!current.is_purchased); // одразу показуємо результат, при помилці повертаємо назад
    const saved = await run(() => setShoppingItemPurchased(itemId, !current.is_purchased));
    if (!saved) setPurchased(current.is_purchased);
  };
  const removeItem = async (listId, itemId) => {
    const done = await run(async () => { await deleteShoppingItem(itemId); return true; });
    if (done) patchList(listId, (l) => ({ ...l, items: l.items.filter((i) => i.id !== itemId) }));
  };

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

      <div className={`budget-body${monthLoading && !baseLoading ? ' is-loading' : ''}`}>
        {error && (
          <div className="b-alert" role="alert">
            <span>{error}</span>
            <button type="button" onClick={retry}>Retry</button>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss">×</button>
          </div>
        )}

        {baseLoading ? (
          <p className="b-loading">Loading…</p>
        ) : (
          <>
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
                  <TransactionForm categories={categories} accountId={accountId} onAdd={addRecord} />
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
                  <TransactionList records={visibleRecords} categories={categories} onDelete={removeRecord} />
                </section>
              </div>
            )}

            {tab === 'shopping' && (
              <ShoppingList
                lists={lists}
                onToggle={toggleItem}
                onAddItem={addItem}
                onDeleteItem={removeItem}
                onAddList={addList}
                onDeleteList={removeList}
              />
            )}

            {tab === 'limits' && (
              <div className="budget-grid budget-grid--limits">
                <section className="b-card">
                  <BudgetLimits items={byCategory} categories={categories} />
                </section>
                <section className="b-card">
                  <LimitsSettings categories={categories} onChange={saveLimit} />
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
