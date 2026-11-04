import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { loginUser, registerUser } from '../api/authApi';
import { clearStoredAuth, readStoredAuth, storeAuth } from '../auth/authStorage';
import { getOAuthRedirectUrl } from '../auth/oauthRedirect';
import { resetUserCaches, syncUserCaches } from '../utils/localCache';

const AuthContext = createContext(null);

const SESSION_MISSING_MESSAGE =
  'Your session has no Supabase login, so photos and profile data cannot be saved. Sign out and sign in again.';

/**
 * Two logins exist side by side:
 *  - the Django API issues its own token (email + password) used for /api requests;
 *  - Supabase owns identity metadata, Storage and OAuth (Google).
 *
 * Photos live in Supabase Storage, which requires a Supabase session. Email users
 * therefore also sign in to Supabase with the same credentials — without this every
 * storage call fails with "Auth session missing!".
 */
async function openSupabaseSession(email, password, { createIfMissing = false } = {}) {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return true;
    if (!createIfMissing || error.code !== 'invalid_credentials') return false;

    // Account exists in the Django API but not in Supabase yet (created after the
    // migration). The project auto-confirms emails, so this returns a session.
    const { data } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: email } },
    });
    return Boolean(data?.session);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  // Django API session (email login) and Supabase session (OAuth / storage / profile).
  const [apiSession, setApiSession] = useState(() => readStoredAuth());
  const [authSession, setAuthSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Subscribe before the first read: the OAuth callback emits SIGNED_IN while
    // the client initialises, and that event must not be missed.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setAuthSession(nextSession ?? null);
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error) setAuthSession(data?.session ?? null);
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

  const signIn = useCallback(async ({ email, password }) => {
    const auth = await loginUser({ email, password });
    if (!auth?.access_token) throw new Error('Відповідь API не містить access token.');
    storeAuth(auth);
    setApiSession(auth);
    // Another account may have used this browser: drop its board caches first.
    syncUserCaches(auth?.user?.id);
    await openSupabaseSession(email, password, { createIfMissing: true });
    return auth;
  }, []);

  const signUp = useCallback(async ({ email, password }) => {
    const auth = await registerUser({ email, password, username: email });
    if (auth?.access_token) {
      storeAuth(auth);
      setApiSession(auth);
      syncUserCaches(auth?.user?.id || auth?.id);
    }
    await openSupabaseSession(email, password, { createIfMissing: true });
    return auth;
  }, []);

  const signOut = useCallback(async () => {
    clearStoredAuth();
    resetUserCaches();
    setApiSession(null);
    setAuthSession(null);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error && error.status !== 401) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // A Django token from an earlier email login must not survive into a Google
    // session, otherwise API calls would keep sending the stale token.
    clearStoredAuth();
    resetUserCaches();
    setApiSession(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Must match a Redirect URL in Supabase → Authentication → URL Configuration.
        redirectTo: getOAuthRedirectUrl(),
      },
    });
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(async ({ name }) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Вкажіть імʼя.');

    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName, name: trimmedName, username: trimmedName },
    });
    if (error) {
      if (error.name === 'AuthSessionMissingError') throw new Error(SESSION_MISSING_MESSAGE);
      throw error;
    }
    return data.user;
  }, []);

  // Supabase owns user_metadata (avatar path, display name); the Django user keeps
  // its own id and email so the rest of the app keeps the same identity.
  const user = useMemo(() => (
    authSession?.user
      ? {
          ...authSession.user,
          ...(apiSession?.user || {}),
          user_metadata: authSession.user.user_metadata || {},
        }
      : apiSession?.user || null
  ), [apiSession, authSession]);

  // A different account in this browser must not inherit board caches. Also covers
  // returning from Google, where the user id only becomes known after the redirect.
  const userId = user?.id || '';

  useEffect(() => {
    if (!userId) return;
    syncUserCaches(userId);
  }, [userId]);

  const value = useMemo(() => (
    {
      // Supabase wins: it carries user_metadata (avatar path, display name).
      session: authSession || apiSession,
      token: apiSession?.access_token || authSession?.access_token || null,
      user,
      loading,
      isAuthenticated: Boolean(authSession || apiSession?.access_token),
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      updateProfile,
    }
  ), [apiSession, authSession, loading, user, signIn, signInWithGoogle, signOut, signUp, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
