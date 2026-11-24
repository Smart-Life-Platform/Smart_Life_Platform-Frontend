# Перевірка Smart Life Platform — 24.11.2026

## Оновлення з Git та стан роботи

| Репозиторій | Робоча гілка | Оновлення |
| --- | --- | --- |
| Frontend | `feature/frontend_review_24_11_krivda` | Fast-forward із `f39f484` до `f1eaa53` |
| Backend | `feature/backend_review_24_11_krivda` | Злиття `b3d3b76` із попередньою роботою `2a27401`; merge-коміт `c57d617` |

Під час злиття backend узгоджено конфлікти асистента: збережено попередні
ліміти контексту/відповіді, перевірку власника розмови та відкладену
ініціалізацію Gemini. Водночас враховано нове членство в дошках через
`board_members`, включно зі створенням дошки агентом. Контекст агента більше
не фільтрує дошки через видалене `boards.user_id`.

## Чому Budget довго чекав на дані

Файл: `src/pages/BudgetPage.jsx`.

При відкритті сторінки виконувалися чотири бюджетні запити: категорії,
списки покупок з позиціями, транзакції місяця та місячний підсумок.
`Promise.all` об'єднував категорії зі списками покупок, а загальний
`baseLoading` приховував усі вкладки до завершення обох запитів.
Тому повільні покупки затримували Overview, хоча його графіки їх не використовують.
Історія транзакцій також завантажувалася до відкриття вкладки Transactions.

Виправлення:

- Overview спочатку запитує тільки категорії та підсумок — **2 бюджетні
  запити замість 4**. Це кількість запитів, а не обіцянка зменшення часу вдвічі.
- Shopping завантажується при відкритті своєї вкладки. У межах відкритої
  сторінки результат зберігається; звичайне перемикання вкладок не повторює запит.
- Історія транзакцій завантажується тільки на Transactions. Успішно отримана
  історія повторно використовується для того самого місяця/версії даних.
- Додавання або видалення транзакції оновлює підсумок та активну історію.
  Retry повторно запитує потрібні дані; помилки не стають постійним кешем.
- Стани завантаження розділені, застарілі відповіді попереднього місяця
  відкидаються. Покупки не залежать від завантаження категорій або підсумку.
- Зіставлення категорій підсумку виконується через `Map`, без повторного
  `categories.find()` для кожного рядка.

Грошові розрахунки залишаються на backend із попередньою точністю;
довготривалий спільний кеш фінансових даних не вводився.
Значення таймауту 45 секунд саме по собі не змушує запит чекати 45 секунд:
це верхня межа очікування, а не затримка.

Додатковий чинник у Supabase-режимі — кожен HTTP-запит backend перевіряє
Bearer-токен через Supabase Auth, а потім читає дані через PostgREST.
Зменшення зайвих бюджетних запитів прибирає частину цієї роботи. Реальний
TTFB, cold start хостингу та швидкість Supabase без Network/HAR і серверних
метрик не виміряні; вважати цю зміну усуненням усіх можливих затримок не можна.

## Чому Calendar повертав із localhost на деплой

У перевіреному коді підключення Calendar — це окремий Google OAuth-потік,
а не Supabase Google sign-in. Frontend просив у backend готовий `auth_url`.
Backend підставляв єдиний `GOOGLE_REDIRECT_URI` незалежно від того, звідки
відкрито frontend. Якщо у backend задано адресу деплоя, Google отримує саме її.
Окремо попередній fallback `/oauth/google/callback` не збігався з наявним
frontend-маршрутом `/google-calendar/callback`.

Фактичні налаштування Google Console, Supabase Dashboard і production env
під час перевірки не читалися; підтверджено механізм помилки в коді.

Виправлення:

1. Frontend передає `redirect_uri` як поточний `window.location.origin`
   плюс `/google-calendar/callback`. І початок авторизації, і callback
   використовують ту саму адресу, включно з протоколом і портом.
2. Backend перевіряє адресу за серверним списком дозволених URL. До нього
   входять канонічні callback на `CORS_ALLOWED_ORIGINS`, явно задані
   `GOOGLE_CALENDAR_REDIRECT_URIS` та `GOOGLE_REDIRECT_URI`.
   Довільний домен із query-параметра не приймається.
3. OAuth-запит отримує підписаний `state`, пов'язаний із користувачем і callback.
   Повернення перевіряє підпис, користувача, адресу та строк 10 хвилин.
4. Попередній callback зберігав `mock-access-token-*` та `mock-refresh-token-*`
   замість звернення до Google. Тепер код обмінюється на токени через
   `https://oauth2.googleapis.com/token`, із таймаутом 15 секунд.
   Підставлені браузером тестові токени не використовуються. Якщо обмін
   неуспішний або Google не надав refresh token, фіктивне підключення не створюється.
5. Відповідь `is_connected` нормалізується в `connected`, який очікують обидва
   frontend-віджети. Раніше активне підключення могло виглядати непідключеним.
6. Settings показує результат callback, включно з помилкою або відмовою Google.
   У Supabase-вході через Google також виправлено `getSiteOrigin()`:
   production `REACT_APP_SITE_URL` більше не перекриває localhost/127.0.0.1/IPv6 loopback.

Контракт callback змінився: обов'язкові `code`, `state`, `redirect_uri`.
Frontend і backend цих гілок треба оновлювати разом; стару незавершену
авторизацію слід почати заново.

## Що налаштувати для локального Calendar

У backend `.env` потрібні значення власного Google OAuth Web client:

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google-calendar/callback
GOOGLE_CALENDAR_REDIRECT_URIS=http://localhost:3000/google-calendar/callback,http://127.0.0.1:3000/google-calendar/callback
```

Не переносити `GOOGLE_CLIENT_SECRET` у frontend. Для іншого порту або домену
додати точний callback у дозволений серверний список. Перезапустити backend
після зміни env. Frontend має звертатися до backend із цими виправленнями.

У Google Console для **того самого client ID** додати в Authorized redirect URIs:

```text
http://localhost:3000/google-calendar/callback
http://127.0.0.1:3000/google-calendar/callback
https://your-deployed-frontend.example/google-calendar/callback
```

Останню адресу замінити реальним доменом. `localhost` і `127.0.0.1` — різні URL.
Додавання лише JavaScript origin не замінює реєстрацію повного callback.
Додати використовуваний Google-акаунт до test users, якщо OAuth-застосунок
працює в тестовому режимі, та перевірити доступність Calendar API/scopes.

Supabase Redirect URLs налаштовуються окремо для входу в застосунок:
`http://localhost:3000/auth/callback` і відповідна адреса деплоя.
Вони не замінюють callback прямої Calendar-інтеграції. Опис параметрів і
обміну коду звірено з [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server)
та [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Виявлені межі Calendar, які залишаються

Модуль `events` зберігає з'єднання через Django ORM і `ForeignKey` на
Django user. У `DB_BACKEND=supabase` авторизація повертає `SupabaseUser`,
який не є цією ORM-моделлю. Сам redirect цього не виправляє. Тепер операції
зі сховищем Calendar повертають контрольований HTTP 503 для такого акаунта,
замість падіння ORM або витрати Google-коду перед неможливим збереженням.
Для цього режиму потрібен окремий адаптер до погодженої Supabase-схеми;
автоматичне створення або зіставлення користувачів не виконувалося.

Також `GoogleCalendarSyncView` наразі не створює Google Calendar API-клієнт:
автоматичне читання/запис реальних подій і оновлення access token за refresh
token ще не завершені. Обмін OAuth-коду та виправлений redirect не означають
готову двосторонню синхронізацію. Це конкретні обмеження наявної реалізації,
а не підтвердження збою в Google Console.

## Перевірки

- Після оновлення з Git: frontend — 55 тестів, backend — 192 тести, успішно.
- Після виправлень: frontend — 17 наборів, **65 тестів**, успішно.
- Backend — **202 тести**, успішно; окремо **10 Supabase-тестів**, успішно.
- Додано 5 frontend-перевірок Budget та 5 Calendar/OAuth-перевірок.
- Додано 10 backend OAuth-перевірок: localhost при production-default,
  недозволені URL, підпис/state/строк/користувач, обмін коду, помилка Google,
  відсутній refresh token, відсутній client ID і непідтриманий тип користувача.


Команди frontend:

```bash
npm test -- --watchAll=false --runInBand
npm run build
git diff --check
```

Команди backend із папки `backend`:

```bash
.venv/Scripts/python.exe manage.py test apps --settings=Smart_Life_Platform.test_settings --noinput
.venv/Scripts/python.exe manage.py test tests_supabase --settings=Smart_Life_Platform.supabase_test_settings --noinput
.venv/Scripts/python.exe manage.py makemigrations --check --dry-run --settings=Smart_Life_Platform.test_settings
git diff --check
```

Міграції, отримані з `developer`, застосовано тільки в тимчасовій тестовій базі.
Реальну базу й зовнішні OAuth-налаштування не змінювали. Під час тестів
залишаються попередження React Router v7 та наявне попередження `act()`
у Kanban-тесті; вони не є доказом помилки Budget/Calendar.

Для ручної перевірки: у Network відкрити Budget і перевірити лише два початкові
бюджетні запити; перейти на Transactions/Shopping і переконатися, що їхні
запити з'являються за потреби. Для OAuth до переходу в Google перевірити
`redirect_uri` в отриманому `auth_url`; він має містити поточний localhost
і правильний порт. Повний live-сценарій перевіряти у підтриманому ORM-режимі
після налаштування Google client; Supabase Calendar потребує описаного адаптера.
