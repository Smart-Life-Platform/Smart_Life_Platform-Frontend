export const accounts = [
  { id: 'all', name: 'All Accounts' },
  { id: 'card', name: 'Main card' },
  { id: 'credit', name: 'Credit card' },
  { id: 'cash', name: 'Cash' },
];

// icon — ключ з icons.js; color — колір сегмента діаграми та смуги; monthly_limit — тільки для витрат
export const categories = [
  { id: 1, name: 'Groceries', type: 'expense', icon: 'basket', color: '#6b5bd2', monthly_limit: 6000 },
  { id: 2, name: 'Cafés & Restaurants', type: 'expense', icon: 'food', color: '#a77a3b', monthly_limit: 2000 },
  { id: 3, name: 'Transportation', type: 'expense', icon: 'bus', color: '#6b5bd2', monthly_limit: 1000 },
  { id: 4, name: 'Pharmacies', type: 'expense', icon: 'health', color: '#4a8f73', monthly_limit: 1500 },
  { id: 5, name: 'Utilities', type: 'expense', icon: 'home', color: '#6b5bd2', monthly_limit: 3500 },
  { id: 6, name: 'Entertainment', type: 'expense', icon: 'star', color: '#a77a3b', monthly_limit: 1200 },
  { id: 7, name: 'Other', type: 'expense', icon: 'other', color: '#2b2b33', monthly_limit: 0 },
  { id: 8, name: 'Salary', type: 'income', icon: 'work', color: '#4a8f73', monthly_limit: 0 },
  { id: 9, name: 'Gifts', type: 'income', icon: 'gift', color: '#4a8f73', monthly_limit: 0 },
];

export const records = [
  { id: 1, type: 'income', amount: 25000, category_id: 8, date: '2026-10-05', description: 'Salary', account_id: 'card' },
  { id: 2, type: 'income', amount: 1500, category_id: 9, date: '2026-10-12', description: 'Birthday Gift', account_id: 'cash' },
  { id: 3, type: 'expense', amount: 1240, category_id: 1, date: '2026-10-02', description: 'Supermarket', account_id: 'card' },
  { id: 4, type: 'expense', amount: 860, category_id: 1, date: '2026-10-09', description: 'Groceries', account_id: 'card' },
  { id: 5, type: 'expense', amount: 2150, category_id: 1, date: '2026-10-16', description: 'Groceries for the Week', account_id: 'credit' },
  { id: 6, type: 'expense', amount: 350, category_id: 2, date: '2026-10-03', description: 'Coffee with friends', account_id: 'card' },
  { id: 7, type: 'expense', amount: 780, category_id: 2, date: '2026-10-11', description: 'Pizza', account_id: 'cash' },
  { id: 8, type: 'expense', amount: 420, category_id: 3, date: '2026-10-04', description: 'Transport pass', account_id: 'card' },
  { id: 9, type: 'expense', amount: 180, category_id: 3, date: '2026-10-14', description: 'Taxi', account_id: 'card' },
  { id: 10, type: 'expense', amount: 640, category_id: 4, date: '2026-10-07', description: 'Vitamins', account_id: 'card' },
  { id: 11, type: 'expense', amount: 3200, category_id: 5, date: '2026-10-10', description: '', account_id: 'card' },
  { id: 12, type: 'expense', amount: 450, category_id: 6, date: '2026-10-13', description: 'Cinema', account_id: 'credit' },
  { id: 13, type: 'expense', amount: 300, category_id: 7, date: '2026-10-15', description: 'Miscellaneous', account_id: 'cash' },
  { id: 14, type: 'income', amount: 24000, category_id: 8, date: '2026-09-05', description: 'Salary', account_id: 'card' },
  { id: 15, type: 'expense', amount: 5200, category_id: 1, date: '2026-09-18', description: 'Groceries', account_id: 'card' },
  { id: 16, type: 'expense', amount: 3100, category_id: 5, date: '2026-09-10', description: '', account_id: 'card' },
  { id: 17, type: 'expense', amount: 900, category_id: 2, date: '2026-09-21', description: 'Restaurant', account_id: 'credit' },
];

export const shoppingLists = [
  {
    id: 1,
    title: 'Weekly groceries',
    items: [
      { id: 1, name: 'Milk', quantity: 2, is_purchased: true },
      { id: 2, name: 'Bread', quantity: 1, is_purchased: false },
      { id: 3, name: 'Eggs', quantity: 10, is_purchased: false },
      { id: 4, name: 'Apples', quantity: 6, is_purchased: false },
    ],
  },
  {
    id: 2,
    title: 'Household',
    items: [
      { id: 5, name: 'Laundry detergent', quantity: 1, is_purchased: false },
      { id: 6, name: 'Sponges', quantity: 3, is_purchased: true },
    ],
  },
];
