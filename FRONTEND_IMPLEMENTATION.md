# Smart Life Platform — інструкція для frontend-модуля

Цей документ описує реалізацію частини програміста 1: авторизацію через
Supabase, API-клієнт із JWT, головний planner/dashboard, календар і Kanban-
дошку задач.

ТЗ визначає такі дані задачі:

```text
id, user_id, title, description, category_id, status_id, priority,
due_date, due_time, is_recurring, created_at, updated_at
```

Обов'язкові можливості:

- CRUD задач;
- категорії задач із кольором та іконкою;
- статуси задач;
- календар день/тиждень/місяць;
- drag-and-drop для зміни дати/часу;
- Kanban-представлення за статусами;
- фільтри та сортування;
- деталі задачі та підзадачі;
- віджет «Задачі на сьогодні» для dashboard;
- JWT у кожному запиті до захищеного API.

Зображення з прикладом planner потрібно використовувати як напрямок для
головного екрана: верхній header, перемикачі розділів, навігація по датах,
велика календарна сітка та права інформаційна панель. Kanban є альтернативним
виглядом задач, а не заміною календаря.

---

## 1. Поточний стан проєкту

Проєкт — Create React App:

```text
smart_life_platform/
├── public/
├── src/
│   ├── App.css
│   ├── App.js
│   ├── App.test.js
│   ├── index.css
│   └── index.js
├── package.json
└── package-lock.json
```

Файли `components`, `context` і `screens` поки порожні, тому спочатку їх
потрібно перетворити на функціональну структуру нижче. Не потрібно створювати
новий React-проєкт.

---

## 2. Залежності

Виконати з каталогу `smart_life_platform`:

```bash
npm install axios @supabase/supabase-js react-router-dom
npm install @dnd-kit/core @dnd-kit/sortable
```

Призначення:

- `axios` — єдиний HTTP-клієнт для REST API;
- `@supabase/supabase-js` — session, login, registration, Google OAuth, logout;
- `react-router-dom` — сторінки та захищені маршрути;
- `@dnd-kit/*` — drag-and-drop для Kanban і календаря, з підтримкою keyboard та
  touch-сценаріїв.

Не використовувати `fetch` паралельно з Axios: усі запити повинні проходити
через один API-клієнт, щоб JWT, помилки та base URL оброблялися однаково.

---

## 3. Структура файлів

Рекомендована структура:

```text
src/
├── api/
│   ├── apiClient.js
│   ├── apiErrors.js
│   ├── tasksApi.js
│   ├── categoriesApi.js
│   └── statusesApi.js
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   ├── GoogleLoginButton.jsx
│   │   └── ProtectedRoute.jsx
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Loader.jsx
│   │   ├── ErrorMessage.jsx
│   │   └── EmptyState.jsx
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── RightPanel.jsx
│   ├── calendar/
│   │   ├── CalendarView.jsx
│   │   ├── CalendarToolbar.jsx
│   │   ├── CalendarGrid.jsx
│   │   ├── DayColumn.jsx
│   │   └── CalendarTask.jsx
│   ├── kanban/
│   │   ├── KanbanBoard.jsx
│   │   ├── KanbanColumn.jsx
│   │   ├── TaskCard.jsx
│   │   ├── TaskDetailsPopover.jsx
│   │   └── DropZone.jsx
│   ├── tasks/
│   │   ├── TaskForm.jsx
│   │   ├── TaskFilters.jsx
│   │   ├── TaskList.jsx
│   │   └── SubtaskChecklist.jsx
│   └── dashboard/
│       ├── TodayTasksWidget.jsx
│       └── ProgressWidget.jsx
│
├── context/
│   ├── AuthContext.jsx
│   └── TaskContext.jsx
│
├── hooks/
│   ├── useAuth.js
│   ├── useTasks.js
│   └── useCalendar.js
│
├── lib/
│   └── supabase.js
│
├── pages/
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── PlannerPage.jsx
│   ├── KanbanPage.jsx
│   ├── TaskDetailsPage.jsx
│   └── NotFoundPage.jsx
│
├── routes/
│   └── AppRoutes.jsx
│
├── styles/
│   ├── tokens.css
│   ├── layout.css
│   ├── calendar.css
│   └── kanban.css
│
├── utils/
│   ├── taskStatus.js
│   ├── dateUtils.js
│   └── apiResponse.js
│
├── App.css
├── App.js
├── index.css
└── index.js
```

### Правило відповідальності

- `pages` складають екран із компонентів, але не містять Axios-запитів;
- `components` відповідають за відображення та події користувача;
- `context` зберігає спільний стан;
- `api` містить тільки API-виклики;
- `lib` містить інтеграції із зовнішніми SDK;
- `utils` не мають залежати від React;
- CSS для окремого компонента зберігається поруч із компонентом або в
  `styles`, якщо це спільний стиль.

---

## 4. Налаштування середовищ і портів

Зараз у корені `frontend` уже є змінні:

```env
REACT_APP_SUPABASE_URL=https://<project>.supabase.co
REACT_APP_SUPABASE_PUBLIC_KEY=<publishable-key>
REACT_APP_API_LOCAL_URL=http://127.0.0.1:8000/api
REACT_APP_API_URL=https://smart-life-platform-backend.onrender.com/api
```

Publishable/public key Supabase можна використовувати у frontend. Не можна
додавати до frontend `service_role` key або будь-який секретний ключ.

### Рекомендований спосіб перемикання

Не змінювати URL вручну перед кожним commit. Створити два файли, які не
комітяться:

`frontend/.env.development.local`:

```env
REACT_APP_SUPABASE_URL=https://<project>.supabase.co
REACT_APP_SUPABASE_PUBLIC_KEY=<publishable-key>
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
```

`frontend/.env.production.local`:

```env
REACT_APP_SUPABASE_URL=https://<project>.supabase.co
REACT_APP_SUPABASE_PUBLIC_KEY=<publishable-key>
REACT_APP_API_BASE_URL=https://smart-life-platform-backend.onrender.com/api
```

У коді використовується тільки `REACT_APP_API_BASE_URL`. Якщо командний
процес вимагає саме назви `REACT_APP_API_LOCAL_URL` та `REACT_APP_API_URL`,
залишити обидві змінні й обирати їх у `apiClient.js` за
`process.env.NODE_ENV`. Варіант із різними CRA-файлами безпечніший, бо
production build фізично не підхоплює локальний URL.

Додати до `.gitignore`:

```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

Додати без секретів `.env.example`:

```env
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_PUBLIC_KEY=
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
```

### Порти

| Сервіс | Адреса |
|---|---|
| React dev server | `http://localhost:3000` |
| Django local API | `http://127.0.0.1:8000/api` |
| Django Swagger | `http://127.0.0.1:8000/api/docs/` |
| Render API | `https://smart-life-platform-backend.onrender.com/api` |

`localhost:3000` — це frontend, а не API. Не ставити його в `API_BASE_URL`.
У Django/CORS потрібно дозволити обидва локальні origin:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Також додати production origin Vercel після його створення. Локальний backend
повинен приймати запити з локального frontend, а Render — із production
frontend. Помилка CORS не виправляється в React-коді.

---

## 5. Supabase client та авторизація

### `src/lib/supabase.js`

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabasePublicKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabasePublicKey) {
  throw new Error('Supabase environment variables are not configured');
}

export const supabase = createClient(supabaseUrl, supabasePublicKey);
```

### `src/context/AuthContext.jsx`

AuthContext повинен:

1. викликати `supabase.auth.getSession()` при старті;
2. зберігати `session`, `user` і `loading`;
3. слухати `onAuthStateChange`;
4. очищати subscription у cleanup;
5. надавати `signIn`, `signUp`, `signInWithGoogle`, `signOut`;
6. не зберігати пароль у React state довше, ніж потрібно формі.

Каркас:

```jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        throw error;
      }

      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn: (email, password) =>
        supabase.auth.signInWithPassword({ email, password }),
      signUp: (email, password) =>
        supabase.auth.signUp({ email, password }),
      signInWithGoogle: () =>
        supabase.auth.signInWithOAuth({ provider: 'google' }),
      signOut: () => supabase.auth.signOut(),
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
```

Для production бажано не кидати помилку з async callback без обробки: у
реальному коді передбачити `authError` у state і показати його на сторінці
логіну. В UI не використовувати `alert` як основне повідомлення.

У `src/index.js` обгорнути `App` в `AuthProvider`, а потім у `TaskProvider`,
якщо TaskContext використовує поточного користувача:

```jsx
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

---

## 6. Axios API-клієнт із JWT

### `src/api/apiClient.js`

```js
import axios from 'axios';
import { supabase } from '../lib/supabase';

const baseURL = process.env.REACT_APP_API_BASE_URL;

if (!baseURL) {
  throw new Error('REACT_APP_API_BASE_URL is not configured');
}

export const apiClient = axios.create({
  baseURL: baseURL.replace(/\/+$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return Promise.reject(error);
  }

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      return Promise.reject(new Error('Сесія завершилася. Увійдіть знову.'));
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error('Недостатньо прав для цієї операції.'));
    }

    if (error.response) {
      const detail =
        error.response.data?.detail ||
        error.response.data?.message ||
        'Сервер відхилив запит.';

      return Promise.reject(new Error(detail));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Сервер не відповів вчасно.'));
    }

    return Promise.reject(new Error('Не вдалося підключитися до API.'));
  }
);
```

Важливо:

- не додавати `Bearer undefined`;
- не логувати access token у console;
- не ковтати помилки порожнім `catch`;
- 401 показувати як стан повторної авторизації;
- після login Supabase сам оновлює session, а interceptor бере актуальний token
  для наступного запиту.

Якщо backend очікує не `/api`, а конкретний префікс із Swagger, змінити тільки
env/base URL або endpoint-функції, не JSX.

---

## 7. API-функції задач

Перед реалізацією відкрити Swagger і зафіксувати реальні назви маршрутів.
Нижче наведений контракт є шаблоном, а не підставою вигадувати endpoint:

### `src/api/tasksApi.js`

```js
import { apiClient } from './apiClient';

export async function listTasks(params = {}) {
  const response = await apiClient.get('/tasks/', { params });
  return response.data;
}

export async function getTask(taskId) {
  const response = await apiClient.get(`/tasks/${taskId}/`);
  return response.data;
}

export async function createTask(payload) {
  const response = await apiClient.post('/tasks/', payload);
  return response.data;
}

export async function updateTask(taskId, payload) {
  const response = await apiClient.patch(`/tasks/${taskId}/`, payload);
  return response.data;
}

export async function deleteTask(taskId) {
  await apiClient.delete(`/tasks/${taskId}/`);
}
```

Окремі функції, які можуть знадобитися за Swagger:

```js
export async function listTasksByDateRange(from, to) {
  const response = await apiClient.get('/tasks/', {
    params: { from, to },
  });

  return response.data;
}

export async function listCategories() {
  const response = await apiClient.get('/task-categories/');
  return response.data;
}

export async function listStatuses() {
  const response = await apiClient.get('/task-statuses/');
  return response.data;
}
```

### Таблиця операцій

| UI-дія | HTTP | Дані |
|---|---|---|
| завантажити задачі | `GET /tasks/` | `from`, `to`, `status_id`, `category_id` |
| створити | `POST /tasks/` | title, description, status_id, priority, due_date, due_time |
| відкрити деталі | `GET /tasks/:id/` | — |
| відредагувати | `PATCH /tasks/:id/` | змінені поля |
| видалити | `DELETE /tasks/:id/` | — |
| перенести в Kanban | `PATCH /tasks/:id/` | `status_id` |
| перенести в календарі | `PATCH /tasks/:id/` | `due_date`, `due_time` |
| підзадача | endpoint із Swagger | title, is_done |

Якщо API повертає пагінацію Django REST Framework:

```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": []
}
```

нормалізувати `results` в одному місці, а не перевіряти формат у кожному
компоненті.

---

## 8. Маршрути та головний екран

Маршрути:

```text
/              — dashboard/planner
/login         — вхід
/register      — реєстрація
/planner       — календар день/тиждень/місяць
/kanban        — Kanban за статусами
/tasks/:id     — повні деталі задачі
```

`AppLayout` має містити:

1. Header з логотипом;
2. посилання `Planner`, `Tasks`, `Insights`;
3. кнопку `Create`;
4. профіль користувача та logout;
5. `Outlet` для активної сторінки;
6. праву панель, яку можна згортати.

На desktop головний planner повинен мати:

```text
Header
├── logo
├── Planner / Meetings / Scheduling / Insights
└── Create / avatar

Toolbar
├── previous / next
├── поточний місяць або тиждень
├── Today
├── Preview mode
└── налаштування / календар

Content
├── часова шкала
├── календарна сітка
└── права панель focus/tasks/insights
```

На mobile верхню навігацію та праву панель перетворити на drawer/bottom sheet.
Не робити горизонтальний overflow всієї сторінки через фіксовану ширину
calendar grid.

---

## 9. Kanban і drop-up ефект

### Стани колонок

Статуси повинні надходити з API (`task_status`) і мати `order`. Не хардкодити
назви статусів у десятках компонентів. Для fallback можна використовувати:

```js
export const FALLBACK_STATUSES = [
  { id: 'planned', name: 'Заплановано', order: 1 },
  { id: 'in_progress', name: 'У процесі', order: 2 },
  { id: 'done', name: 'Виконано', order: 3 },
  { id: 'cancelled', name: 'Скасовано', order: 4 },
];
```

### Drag-and-drop

`DndContext` повинен:

1. зберігати `activeTaskId`;
2. визначати `overColumnId`;
3. оптимістично переміщати картку в UI;
4. викликати `PATCH` зі зміненим `status_id`;
5. повернути картку назад, якщо API повернув помилку;
6. показати повідомлення про помилку;
7. після успішного PATCH синхронізувати відповідь backend.

Для переміщення між колонками не робити тільки CSS-імітацію: статус має бути
записаний на backend.

### Drop-up

У цьому проєкті drop-up доцільно реалізувати як деталі картки, що відкриваються
над нею:

- картка має `position: relative`;
- popover має `position: absolute; bottom: calc(100% + 8px)`;
- картка при відкритті отримує більший `z-index`;
- на нижніх картках, де над карткою не вистачає місця, popover відкривати
  вниз;
- закривати по Escape та кліку поза popover;
- `aria-expanded` і `aria-controls` обов'язкові.

Не ховати критичні дії лише на hover: на touch-пристроях відкриття має бути
по click/tap. Анімація повинна поважати
`@media (prefers-reduced-motion: reduce)`.

---

## 10. CalendarView

Календар має підтримувати `day`, `week`, `month`:

```js
const [view, setView] = useState('week');
const [currentDate, setCurrentDate] = useState(new Date());
```

Розділити логіку:

- `CalendarToolbar` — навігація, Today, view switcher;
- `CalendarGrid` — сітка;
- `DayColumn` — один день;
- `CalendarTask` — задача в часовому слоті;
- `useCalendar` — обчислення дат і позицій.

При drop календарної задачі обчислити:

```text
new due_date
new due_time
```

і відправити:

```js
await updateTask(task.id, {
  due_date: newDueDate,
  due_time: newDueTime,
});
```

Для дат використовувати одну бібліотеку або власні UTC-safe helpers. Не
змішувати `new Date('YYYY-MM-DD')` із локальним часом без перевірки timezone:
це може показати задачу на попередній день.

---

## 11. TaskContext

TaskContext зберігає:

```text
tasks
statuses
categories
filters
calendarView
loading
error
selectedTask
```

Методи:

```text
loadTasks(params)
createTask(payload)
updateTask(id, payload)
deleteTask(id)
moveTaskToStatus(id, statusId)
moveTaskToDate(id, dueDate, dueTime)
setFilters(filters)
```

Стан запиту повинен мати окремі `loading`, `saving` та `deleting` стани, щоб
завантаження всієї дошки не блокувало редагування однієї картки.

Оптимістичне оновлення дозволене тільки з rollback:

```text
зберегти попередній список
застосувати локальну зміну
відправити PATCH
успіх -> залишити відповідь API
помилка -> повернути попередній список і показати помилку
```

---

## 12. Форми та валідація

`TaskForm` повинен мати:

- `title` — обов'язкове, непорожнє;
- `description` — необов'язкове;
- `category_id`;
- `status_id`;
- `priority`;
- `due_date`;
- `due_time`;
- `is_recurring`;
- повторення, якщо endpoint підтримує його.

Перед POST/PATCH нормалізувати payload:

```js
{
  title: title.trim(),
  description: description.trim(),
  category_id: categoryId || null,
  status_id: statusId,
  priority,
  due_date: dueDate || null,
  due_time: dueTime || null,
  is_recurring: Boolean(isRecurring)
}
```

Валідація frontend покращує UX, але не замінює валідацію Django. Помилки
полів із відповіді `400` показувати біля відповідного поля.

---

## 13. ProtectedRoute і auth UI

Захистити `/planner`, `/kanban`, `/tasks/:id`. Поведінка:

```text
loading auth -> loader
немає session -> redirect /login
є session -> render page
```

Сторінки login/register повинні мати:

- email;
- password;
- показ помилки Supabase;
- disabled submit під час запиту;
- Google OAuth;
- посилання між login/register;
- стан підтвердження email після signUp.

Logout повинен викликати `supabase.auth.signOut()` і перейти на `/login`.

---

## 14. Тестування

### Unit/component tests

Покрити:

- `TaskCard` відкриває та закриває drop-up details;
- `TaskForm` не відправляє порожній title;
- фільтри та сортування;
- розподіл задач по статусах;
- форматування дат;
- rollback після невдалого переміщення;
- `ProtectedRoute` редиректить неавторизованого користувача.

### API integration tests у frontend

Mock-ити Axios, але перевіряти:

- `Authorization: Bearer <token>`;
- правильний `baseURL`;
- правильні HTTP-методи та payload;
- обробку 400, 401, 403, 404, 500;
- timeout/offline error.

### Ручна перевірка з локальним backend

1. Запустити Django на `127.0.0.1:8000`.
2. Перевірити Swagger.
3. Запустити React на `localhost:3000`.
4. Увійти через Supabase.
5. У DevTools Network перевірити `Authorization`.
6. Створити задачу.
7. Перемістити її Kanban drag-and-drop.
8. Перемістити її на іншу дату/час у календарі.
9. Оновити сторінку та переконатися, що зміни збережені.
10. Перевірити помилки без токена та з простроченою сесією.

Команди:

```bash
npm test -- --watchAll=false
npm run build
```

Перед build перевірити, що production env містить Render API, а не
`127.0.0.1`.

---

## 15. Послідовність реалізації

### Етап 1 — infrastructure

1. Встановити залежності.
2. Створити env-файли та `.env.example`.
3. Створити Supabase client.
4. Реалізувати AuthContext.
5. Створити Axios client з JWT.
6. Перевірити login і запит до захищеного endpoint.

### Етап 2 — shell

1. Додати routes.
2. Реалізувати AppLayout, Header, sidebar/right panel.
3. Зробити responsive layout за макетом planner.
4. Додати ProtectedRoute.

### Етап 3 — tasks API та базовий UI

1. Зафіксувати фактичні endpoint із Swagger.
2. Реалізувати tasks/categories/statuses API.
3. Додати TaskContext.
4. Зробити TaskForm, TaskList і TaskDetails.

### Етап 4 — календар

1. Зробити toolbar day/week/month.
2. Зробити календарну сітку.
3. Вивести задачі за `due_date`/`due_time`.
4. Додати drag-and-drop з PATCH.

### Етап 5 — Kanban

1. Вивести колонки з API-статусів.
2. Додати картки та фільтри.
3. Додати drag-and-drop між колонками.
4. Додати drop-up details.
5. Додати rollback та помилки.

### Етап 6 — dashboard і перевірка

1. Додати «Задачі на сьогодні».
2. Додати прогрес виконання.
3. Написати component/API tests.
4. Запустити local build і production build.
5. Перед commit перевірити env, CORS і відсутність токенів у git diff.

---

## 16. Checklist перед commit/push

- [ ] У коді немає захардкодженого Render URL.
- [ ] У production env API — `https://smart-life-platform-backend.onrender.com/api`.
- [ ] У local env API — `http://127.0.0.1:8000/api`.
- [ ] У коді використовується Axios, а не дубльований `fetch`.
- [ ] JWT додається до кожного API-запиту.
- [ ] `service_role` key не потрапив у frontend або git.
- [ ] `localhost:3000` і `127.0.0.1:3000` дозволені CORS.
- [ ] 401/403/400/500 показують зрозумілий стан UI.
- [ ] Drag-and-drop виконує реальний PATCH.
- [ ] Помилка PATCH робить rollback.
- [ ] Drop-up працює по click/tap, не лише по hover.
- [ ] Є keyboard focus і `aria-expanded`.
- [ ] Перевірено mobile layout.
- [ ] `npm test -- --watchAll=false` пройшов.
- [ ] `npm run build` пройшов.
- [ ] `git diff` не містить секретів або `.env.local`.

