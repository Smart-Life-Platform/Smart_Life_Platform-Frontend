import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession: jest.fn(), onAuthStateChange: jest.fn() } },
}));

test('leaves the loading state when reading the session rejects', async () => {
  supabase.auth.getSession.mockRejectedValue(new Error('Storage unavailable'));
  const unsubscribe = jest.fn();
  supabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
  const { result, unmount } = renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.isAuthenticated).toBe(false);
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
