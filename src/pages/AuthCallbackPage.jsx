import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { describeCallbackError, readCallbackParams } from '../auth/oauthParams';
import { getOAuthRedirectUrl } from '../auth/oauthRedirect';

const SESSION_TIMEOUT_MS = 10000;
const POLL_INTERVAL_MS = 200;
const SUCCESS_PATH = '/kanban';

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Landing page for the OAuth redirect.
 *
 * Supabase sends the browser here (see getOAuthRedirectUrl) with either
 * `?code=...` (PKCE) or `#access_token=...` (implicit), or with an `error`
 * parameter when the sign-in failed. The Supabase client exchanges the code
 * during its own initialisation, so this page only has to wait for the session
 * to appear — and to show the reason when it does not.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [failure, setFailure] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const params = readCallbackParams();

    // Supabase appends failures to the redirect URL — never swallow them.
    if (params.error || params.errorCode) {
      setFailure(describeCallbackError(params));
      return () => { cancelled = true; };
    }

    async function waitForSession() {
      const deadline = Date.now() + SESSION_TIMEOUT_MS;
      let exchangeAttempted = false;

      while (!cancelled && Date.now() < deadline) {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (data?.session) {
          navigate(SUCCESS_PATH, { replace: true });
          return;
        }
        if (error) {
          setFailure({ code: error.code || '', message: error.message });
          return;
        }

        // The SDK normally performs this exchange itself. If the code is still in
        // the URL afterwards, finish the exchange here so the user gets a real
        // error instead of a silent bounce back to /login.
        if (params.code && !exchangeAttempted) {
          exchangeAttempted = true;
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (cancelled) return;
          if (exchangeError) {
            setFailure({ code: exchangeError.code || '', message: exchangeError.message });
            return;
          }
          continue;
        }

        await wait(POLL_INTERVAL_MS);
      }

      if (cancelled) return;
      setFailure({
        code: 'session_not_created',
        message: `Supabase did not return a session to this page. It must redirect to ${getOAuthRedirectUrl()} — add that exact URL under Authentication → URL Configuration → Redirect URLs.`,
      });
    }

    waitForSession();

    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-message">
        <h1>{failure ? 'Sign-in could not be completed' : 'Signing you in…'}</h1>
        {failure ? (
          <>
            <p className="auth-subtitle">{failure.message}</p>
            {failure.code && (
              <p className="auth-debug">
                Error code: <code>{failure.code}</code>
              </p>
            )}
            <Link className="primary-button full-width auth-link-button" to="/login" replace>
              Back to sign in
            </Link>
          </>
        ) : (
          <p className="auth-subtitle">Finishing the Google sign-in.</p>
        )}
      </section>
    </main>
  );
}
