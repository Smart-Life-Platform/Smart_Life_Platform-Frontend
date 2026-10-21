import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isAuthenticated: false,
    loading: false,
    user: null,
    signOut: jest.fn(),
  }),
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
