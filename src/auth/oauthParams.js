/**
 * Supabase returns the result of an OAuth round-trip appended to the callback
 * URL in one of two shapes:
 *
 *   PKCE flow:     /auth/callback?code=xxxxxxxx
 *   Implicit flow: /auth/callback#access_token=...&refresh_token=...
 *
 * Failures are appended the same way, and they are the reason a sign-in can look
 * "silently broken" — the app just lands back on /login without any message:
 *
 *   /auth/callback#error=access_denied&error_code=otp_expired&error_description=...
 *   /auth/callback?error=server_error&error_code=...&error_description=...
 *
 * Always read both the query string and the hash fragment.
 */
export function readCallbackParams(href = window.location.href) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const pick = (key) => url.searchParams.get(key) || hash.get(key) || '';

  return {
    code: pick('code'),
    access_token: Boolean(pick('access_token')),
    error: pick('error'),
    errorCode: pick('error_code'),
    errorDescription: pick('error_description'),
    type: pick('type'),
  };
}

const KNOWN_ERRORS = {
  access_denied: 'The Google sign-in was cancelled before it finished. Try again when you are ready.',
  redirect_uri_mismatch:
    'Google rejected the callback URL. The Supabase callback URL (https://<project-ref>.supabase.co/auth/v1/callback) must be listed in the Google OAuth client under "Authorized redirect URIs".',
  bad_oauth_state:
    'The sign-in attempt expired or was started in another browser. Start the sign-in again from this tab.',
  bad_code_verifier:
    'This browser no longer holds the key for this sign-in attempt (it was started in another tab, profile or browser). Start the sign-in again from this tab.',
  otp_expired: 'The sign-in link has expired. Start the sign-in again.',
  auth_timeout: 'Supabase did not answer in time. Try again.',
  server_error: 'Supabase could not complete the sign-in because of a server-side error.',
};

/**
 * Turns the raw parameters Supabase appended to the URL into something a user
 * (and a developer) can act on.
 */
export function describeCallbackError(params) {
  const code = params.errorCode || params.error || '';
  const fallback = params.errorDescription || 'Supabase returned an error instead of a session.';

  return {
    code,
    message: KNOWN_ERRORS[code] || KNOWN_ERRORS[params.error] || fallback,
    description: params.errorDescription || '',
  };
}
