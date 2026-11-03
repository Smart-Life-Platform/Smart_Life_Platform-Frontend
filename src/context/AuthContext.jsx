import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { loginUser, registerUser } from '../api/authApi';
import { clearStoredAuth, readStoredAuth, storeAuth } from '../auth/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const storedAuth = readStoredAuth();
    if (storedAuth?.access_token) {
      setSession(storedAuth);
      setLoading(false);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setLoading(false);
        return;
      }

      if (mounted) {
        if (data.session || !storedAuth?.access_token) setSession(data.session);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) {
        setSession(null);
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        if (nextSession || !readStoredAuth()?.access_token) setSession(nextSession);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
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
    const { error } = await supabase.auth.signOut();
    if (error && error.status !== 401) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/planner` },
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
