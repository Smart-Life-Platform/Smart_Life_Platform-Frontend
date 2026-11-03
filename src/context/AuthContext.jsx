import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { loginUser, registerUser } from '../api/authApi';
import { clearStoredAuth, readStoredAuth, storeAuth } from '../auth/authStorage';
import { getOAuthRedirectUrl } from '../auth/oauthRedirect';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // `session` is either a Supabase session (OAuth, magic links) or the token pair
  // returned by the Django API (email + password). Supabase wins when both exist.
  const [session, setSession] = useState(() => readStoredAuth());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Subscribe before the first read: the OAuth callback emits SIGNED_IN while
    // the client initialises, and that event must not be missed.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      if (nextSession) {
        setSession(nextSession);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_OUT') {
        clearStoredAuth();
        setSession(null);
        setLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        // getSession() waits for the URL/token handling, so a session here means the
        // OAuth redirect has already been processed.
        if (!error && data?.session) setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async ({ email, password }) => {
      const auth = await loginUser({ email, password });
      if (!auth?.access_token) throw new Error('Відповідь API не містить access token.');
      storeAuth(auth);
      setSession(auth);
      return auth;
    },
    []
  );

  const signUp = useCallback(
    async ({ email, password }) => {
      const auth = await registerUser({ email, password, username: email });
      if (auth?.access_token) {
        storeAuth(auth);
        setSession(auth);
      }
      return auth;
    },
    []
  );

  const signOut = useCallback(async () => {
    clearStoredAuth();
    setSession(null);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error && error.status !== 401) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Must match a Redirect URL in Supabase → Authentication → URL Configuration.
        // The browser returns to /auth/callback?code=... where the SDK builds the session.
        redirectTo: getOAuthRedirectUrl(),
      },
    });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async ({ name }) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Вкажіть імʼя.');
    const { data, error } = await supabase.auth.updateUser({ data: { full_name: trimmedName, name: trimmedName, username: trimmedName } });
    if (error) throw error;
    setSession((current) => current ? { ...current, user: data.user } : current);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      session,
      token: session?.access_token || null,
      user: session?.user || null,
      loading,
      isAuthenticated: Boolean(session),
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      updateProfile,
    }),
    [loading, session, signIn, signInWithGoogle, signOut, signUp, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
