# Фото профілю: Supabase Storage

## 1. Створи bucket і права доступу

Відкрий Supabase Dashboard → потрібний проєкт → SQL Editor → New query.
Скопіюй весь вміст `supabase/avatars.sql` та натисни Run.

Скрипт створює публічний bucket `avatars`: JPEG/PNG/WebP, максимум 5 MB.
Авторизований користувач може завантажувати, переглядати список і видаляти файли тільки у власній папці `<auth.uid()>/`. Оновлення файлів на місці не дозволене: кожне фото має нове ім'я.
Публічні URL доступні без авторизації. Це підходить для публічних аватарів; для приватних фото потрібен private bucket і signed URLs замість `getPublicUrl`.

Скрипт можна виконати повторно. Якщо bucket `avatars` уже існує, скрипт змінить його налаштування на публічні та встановить обмеження. Перед запуском перевір, що він не містить приватних файлів. У Storage → Policies перевір відсутність інших широких policies на цей bucket: PostgreSQL поєднує permissive policies через OR.

## 2. Налаштуй фронтенд

Створи `.env.local` у корені фронтенду (файл ігнорується Git):

```dotenv
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_PUBLIC_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
```

URL та публічний ключ візьми в Supabase Dashboard → Project Settings → API Keys / Data API. Не використовуй secret або service-role ключ у React.
Перезапусти `npm start`. У Vercel додай ті самі змінні для потрібного середовища та повтори деплой.

## 3. Зв'язок із бекендом

Локальна копія backend розташована в `backend/` і є окремим Git-репозиторієм; ця папка ігнорується фронтендом.
Backend і frontend мають використовувати один Supabase проєкт. Фронтенд завантажує фото напряму з JWT поточного користувача, без передачі приватного серверного ключа.

Шлях зберігається в Supabase Auth `user_metadata.avatar_path`. AuthContext отримує зміну через `USER_UPDATED`; фото зберігається після повторного входу. Django upload endpoint і нова таблиця для цього сценарію не потрібні.
Наявні Django `/auth/users/` відповіді не містять `avatar_path`; інші клієнти, які читають профіль виключно через Django, потребуватимуть окремого розширення serializer/response. Режим backend із SQLite не підтримує цю інтеграцію.

## 4. Перевір вручну

1. Увійди та відкрий `/profile`. Завантаж зображення до 5 MB.
2. У Storage → avatars має з'явитися файл у папці UUID користувача.
3. Перезавантаж сторінку: фото має залишитися. Заміни фото: старий файл має видалитися.
4. У другому акаунті перевір, що завантаження або видалення за шляхом першого користувача відхиляється. Без сесії upload також має відхилятися. Публічне читання за URL очікувано дозволене.
5. Перевір відхилення файлів понад 5 MB та інших MIME-типів як у UI, так і напряму Storage API.

`Bucket not found` означає, що SQL не виконаний у потрібному проєкті. `new row violates row-level security policy` зазвичай означає відсутню сесію, неправильний UUID у шляху або відсутню INSERT policy.

Файли Storage та Auth metadata не зберігаються в одній транзакції. За помилки збереження metadata застосунок намагається прибрати новий файл; за невдалого очищення старого показує повідомлення. Переривання вкладки або мережі може залишити невикористаний файл; за потреби їх можна очищати окремим серверним завданням.

Офіційна документація: [Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Storage quickstart](https://supabase.com/docs/guides/storage/quickstart).
