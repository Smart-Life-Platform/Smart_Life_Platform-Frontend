export const accounts = [
  { id: 'all', name: 'Всі рахунки' },
  { id: 'card', name: 'Картковий рахунок' },
  { id: 'credit', name: 'Кредитна картка' },
  { id: 'cash', name: 'Готівка' },
];

// icon — ключ з icons.js; monthly_limit — тільки для витрат
export const categories = [
  { id: 1, name: 'Продукти', type: 'expense', icon: 'cart', color: '#2f9e6b', monthly_limit: 6000 },
  { id: 2, name: 'Кафе та ресторани', type: 'expense', icon: 'coffee', color: '#e8a33d', monthly_limit: 2000 },
  { id: 3, name: 'Транспорт', type: 'expense', icon: 'bus', color: '#3b82c4', monthly_limit: 1000 },
  { id: 4, name: 'Аптеки', type: 'expense', icon: 'health', color: '#d9534f', monthly_limit: 1500 },
  { id: 5, name: 'Комунальні послуги', type: 'expense', icon: 'home', color: '#8e6bbf', monthly_limit: 3500 },
  { id: 6, name: 'Розваги', type: 'expense', icon: 'fun', color: '#e0679a', monthly_limit: 1200 },
  { id: 7, name: 'Інше', type: 'expense', icon: 'other', color: '#8a96a3', monthly_limit: 0 },
  { id: 8, name: 'Зарплата', type: 'income', icon: 'work', color: '#2f9e6b', monthly_limit: 0 },
  { id: 9, name: 'Подарунки', type: 'income', icon: 'gift', color: '#e8a33d', monthly_limit: 0 },
];

export const records = [
  { id: 1, type: 'income', amount: 25000, category_id: 8, date: '2026-10-05', description: 'Зарплата', account_id: 'card' },
  { id: 2, type: 'income', amount: 1500, category_id: 9, date: '2026-10-12', description: 'Подарунок на день народження', account_id: 'cash' },
  { id: 3, type: 'expense', amount: 1240, category_id: 1, date: '2026-10-02', description: 'Сільпо', account_id: 'card' },
  { id: 4, type: 'expense', amount: 860, category_id: 1, date: '2026-10-09', description: 'АТБ', account_id: 'card' },
  { id: 5, type: 'expense', amount: 2150, category_id: 1, date: '2026-10-16', description: 'Продукти на тиждень', account_id: 'credit' },
  { id: 6, type: 'expense', amount: 350, category_id: 2, date: '2026-10-03', description: 'Кава з друзями', account_id: 'card' },
  { id: 7, type: 'expense', amount: 780, category_id: 2, date: '2026-10-11', description: 'Піца', account_id: 'cash' },
  { id: 8, type: 'expense', amount: 420, category_id: 3, date: '2026-10-04', description: 'Проїзний', account_id: 'card' },
  { id: 9, type: 'expense', amount: 180, category_id: 3, date: '2026-10-14', description: 'Таксі', account_id: 'card' },
  { id: 10, type: 'expense', amount: 640, category_id: 4, date: '2026-10-07', description: 'Вітаміни', account_id: 'card' },
  { id: 11, type: 'expense', amount: 3200, category_id: 5, date: '2026-10-10', description: 'Комуналка', account_id: 'card' },
  { id: 12, type: 'expense', amount: 450, category_id: 6, date: '2026-10-13', description: 'Кіно', account_id: 'credit' },
  { id: 13, type: 'expense', amount: 300, category_id: 7, date: '2026-10-15', description: 'Різне', account_id: 'cash' },
  { id: 14, type: 'income', amount: 24000, category_id: 8, date: '2026-09-05', description: 'Зарплата', account_id: 'card' },
  { id: 15, type: 'expense', amount: 5200, category_id: 1, date: '2026-09-18', description: 'Продукти', account_id: 'card' },
  { id: 16, type: 'expense', amount: 3100, category_id: 5, date: '2026-09-10', description: 'Комуналка', account_id: 'card' },
  { id: 17, type: 'expense', amount: 900, category_id: 2, date: '2026-09-21', description: 'Ресторан', account_id: 'credit' },
];

export const shoppingLists = [
  {
    id: 1,
    title: 'Продукти на тиждень',
    items: [
      { id: 1, name: 'Молоко', quantity: 2, is_purchased: true },
      { id: 2, name: 'Хліб', quantity: 1, is_purchased: false },
      { id: 3, name: 'Яйця', quantity: 10, is_purchased: false },
      { id: 4, name: 'Яблука', quantity: 6, is_purchased: false },
    ],
  },
  {
    id: 2,
    title: 'Господарські товари',
    items: [
      { id: 5, name: 'Порошок', quantity: 1, is_purchased: false },
      { id: 6, name: 'Губки', quantity: 3, is_purchased: true },
    ],
  },
];
