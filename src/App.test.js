import { render, screen } from '@testing-library/react';
import App from './App';

const mockAuth = {
  isAuthenticated: false,
  loading: false,
  user: null,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
};

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuth,
}));

jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
  },
}));

afterEach(() => {
  window.history.pushState({}, '', '/login');
  Object.assign(mockAuth, { isAuthenticated: false, loading: false, user: null });
});

test('renders the login screen', async () => {
  window.history.pushState({}, '', '/login');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument();
});

test('renders the 404 screen for an unknown route', async () => {
  window.history.pushState({}, '', '/unknown-page');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  expect(screen.getByText('404')).toBeInTheDocument();
});

test('never draws the workspace sidebar on the login screen, even with a session', async () => {
  // A redirect to /login can happen while a (stale) session is still in memory; the
  // login card used to render inside the full workspace shell in that case.
  Object.assign(mockAuth, { isAuthenticated: true, user: { id: 'u-1', email: 'owner@example.com' } });
  window.history.pushState({}, '', '/login');
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(document.querySelector('.app-sidebar')).toBeNull();
  expect(document.querySelector('.workspace-header')).toBeNull();
  expect(screen.queryByText('Task board')).not.toBeInTheDocument();
  expect(screen.queryByText('Settings & help')).not.toBeInTheDocument();
});
