import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * OAuth callback handler (implicit flow).
 *
 * With flowType:'implicit' Supabase appends tokens directly in the URL hash:
 *   /auth/callback#access_token=...&refresh_token=...&type=bearer
 *
 * Supabase JS SDK's detectSessionInUrl:true automatically parses the hash and
 * fires onAuthStateChange(SIGNED_IN, session) during client initialisation.
 * We just wait for that event and then navigate to /planner.
 *
 * Error cases: Supabase may append ?error=...&error_description=... to the URL
 * (e.g. bad_oauth_callback) — we detect and display that before redirecting.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const handled = useRef(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Check for Supabase OAuth error in query params first
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get('error');
    const oauthErrorDesc = params.get('error_description');

    if (oauthError) {
      const msg = oauthErrorDesc
        ? decodeURIComponent(oauthErrorDesc.replace(/\+/g, ' '))
        : oauthError;
      setErrorMessage(msg);
      // Give user 3 seconds to read the error, then send to login
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    // No error — wait for Supabase to parse the hash and fire SIGNED_IN.
    // onAuthStateChange is the most reliable hook here because detectSessionInUrl
    // processes the hash asynchronously during SDK init.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        listener.subscription.unsubscribe();
        navigate('/planner', { replace: true });
      }
    });

    // Fallback: if hash was already processed before our listener registered,
    // getSession() will have the session ready.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        listener.subscription.unsubscribe();
        navigate('/planner', { replace: true });
      } else if (!window.location.hash.includes('access_token')) {
        // No hash tokens and no session → something went wrong
        listener.subscription.unsubscribe();
        navigate('/login', { replace: true });
      }
      // Otherwise keep waiting for onAuthStateChange to fire
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (errorMessage) {
    return (
      <main className="auth-page">
        <section className="auth-card" style={{ textAlign: 'center', gap: '1rem' }}>
          <h1 style={{ color: 'var(--color-danger, #e53e3e)', fontSize: '1.25rem' }}>
            Sign-in failed
          </h1>
          <p style={{ color: 'var(--text-secondary, #666)', fontSize: '0.95rem' }}>
            {errorMessage}
          </p>
          <p style={{ color: 'var(--text-secondary, #888)', fontSize: '0.85rem' }}>
            Redirecting to login…
          </p>
        </section>
      </main>
    );
  }

  return (
    <div
      className="route-loading"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}
    >
      <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary, #888)' }}>
        Завершення входу…
      </span>
    </div>
  );
}
