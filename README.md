# Smart Life Platform — Frontend

Smart Life Platform is a web application for personal planning, task
management, and finance tracking. The project concept is described in
[`ТЗ_Smart_Life_Platform.md`](../ТЗ_Smart_Life_Platform.md).

The React frontend combines a task planner, calendar, budget, shopping lists,
user profile, and authentication in one interface.

## Feature Status

### Implemented

- Registration, login, logout, and protected routes through Supabase Auth.
- Task planner:
  - Create, edit, and delete tasks.
  - Task title, description, deadline, status, category, and priority fields.
  - Day, week, and month calendar views.
  - Filtering and sorting.
  - Drag-and-drop task rescheduling in the calendar.
  - Overdue task list.
- Django REST API integration through Axios.
- Budget module:
  - Income and expense overview.
  - Transactions, categories, accounts, and limits.
  - Shopping lists.
- User profile:
  - Avatar storage through Supabase Storage.
  - File selection and drag-and-drop upload.
  - JPEG, PNG, and WebP files up to 5 MB.
  - Automatic removal of the previous avatar after a new one is saved.
  - Initials fallback when no photo is available.
- API tests for avatars, tasks, categories, and priorities.

### Planned or Not Yet Integrated

- The statistics page is currently a placeholder.
- The budget module uses local mock data and is ready for backend API
  integration.
- The AI assistant and recommendations from the specification are not yet
  connected to the frontend.
- External calendar integrations and notifications are not yet connected.

## Technologies

- React 19
- React Router
- Supabase Auth and Supabase Storage
- Axios
- `@dnd-kit` for drag-and-drop
- Recharts for budget charts
- Jest and React Testing Library
- Create React App (`react-scripts`)

## Requirements

- Node.js 22 or newer (required by the locked Supabase dependencies).
- npm 9 or newer.
- Access to a Supabase project.
- A running Django backend if tasks, categories, statuses, and priorities are
  expected to load from the API.

## Installation

Go to the frontend directory and install dependencies:

```bash
cd Smart_Life_Platform-Frontend
npm ci
```

## Environment Configuration

Copy `.env.example` to `.env.local` in the repository root and fill in your Supabase values:

```dotenv
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_PUBLIC_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
REACT_APP_API_BASE_URL=http://127.0.0.1:8000/api
```

### Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| `REACT_APP_SUPABASE_URL` | Yes | Supabase project URL |
| `REACT_APP_SUPABASE_PUBLIC_KEY` | Yes | Publishable/anon key used by the browser |
| `REACT_APP_API_BASE_URL` | No | Django API URL; defaults to `http://127.0.0.1:8000/api` |

For production, create environment variables with the same names in Vercel or
your deployment provider. Restart the development server after changing
`.env.local`.

> Do not add a Supabase secret or service-role key to the frontend. All
> variables prefixed with `REACT_APP_` are included in the client bundle.

## Supabase Configuration

1. Create a Supabase project.
2. Enable the required authentication provider under
   **Authentication → Providers**.
3. Create a public Storage bucket named `avatars`.
4. Configure bucket restrictions:
   - MIME types: `image/jpeg`, `image/png`, and `image/webp`;
   - maximum file size: 5 MB.
5. Allow authenticated users to access only their own
   `<user_id>/` folder in the `avatars` bucket.

The avatar path is stored in `user_metadata.avatar_path`. The public URL is
generated through Supabase Storage. If the bucket or its policies are not
configured, avatar uploads will fail with a Storage error.

## Development

Start the development server:

```bash
npm start
```

The application will be available at
[http://localhost:3000](http://localhost:3000).

Main routes:

- `/login` — login;
- `/register` — registration;
- `/planner` — planner and calendar;
- `/budget` — budget and shopping lists;
- `/profile` — profile and avatar;
- `/settings` — settings;
- `/statistics` — statistics section.

## Testing

Run Jest in watch mode:

```bash
npm test
```

Run all tests once:

```bash
npm test -- --watchAll=false --runInBand
```

Tests are located in `src/tests`. API requests are mocked, so a running
backend is not required for these tests.

## Production Build

```bash
npm run build
```

The production bundle is generated in the `build` directory. Before building,
make sure the production values for `REACT_APP_SUPABASE_URL`,
`REACT_APP_SUPABASE_PUBLIC_KEY`, and `REACT_APP_API_BASE_URL` are configured.

## Project Structure

```text
src/
├── api/             # Task, category, priority, and avatar API clients
├── components/      # Calendar, task, budget, layout, and auth components
├── context/         # AuthContext and TaskContext
├── hooks/           # Calendar and task hooks
├── lib/             # Supabase client
├── pages/           # Application pages
├── routes/          # Routes and protected page access
├── styles/          # Global and feature styles
└── tests/           # Jest API tests
```

## Backend API

By default, the frontend expects the Django API at
`http://127.0.0.1:8000/api`. Use `REACT_APP_API_BASE_URL` to specify a staging
or production backend.

Main task endpoints:

- `GET/POST /tasks/tasks/`;
- `PUT/DELETE /tasks/tasks/<id>/`;
- `GET /tasks/tasks/overdue/`;
- `GET /tasks/tasks/by_day/`;
- `GET /tasks/tasks/by_week/`;
- `GET /tasks/tasks/by_month/`;
- `GET /tasks/categories/`;
- `GET /tasks/statuses/`;
- `GET /tasks/priorities/`.

Axios automatically adds the Supabase access token to requests. When the API
returns `401`, the frontend ends the session and redirects the user to
`/login`.

## Deployment

For Vercel:

1. Connect the repository and use the repository root as the root directory.
2. Set the build command to `npm run build`.
3. Set the output directory to `build`.
4. Add the production environment variables.
5. Make sure the backend allows requests from the frontend domain through CORS.

## Security

- Never store secret keys in `.env.local` or in any value that is included in
  the client bundle.
- Verify authentication and RLS policies in Supabase.
- Do not rely only on frontend validation. The backend and Storage policies
  must also validate access rights, file type, and file size.
- Restart the development server after changing Supabase environment
  variables.
