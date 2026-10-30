import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setLoading(false);
        return;
      }

      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    []
  );

  const signUp = useCallback(
    async ({ email, password }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: email } },
      });
      if (error) throw error;
      if (!data.session) {
        throw new Error('Реєстрацію завершено. Підтвердіть email і увійдіть.');
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/planner` },
    });
    if (error) throw error;
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
    }),
    [loading, session, signIn, signInWithGoogle, signOut, signUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
