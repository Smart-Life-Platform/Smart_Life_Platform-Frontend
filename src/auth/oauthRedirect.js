export const OAUTH_CALLBACK_PATH = '/auth/callback';

/**
 * Public origin the app is opened from.
 *
 * `REACT_APP_SITE_URL` is optional and only needed when the browser origin is not
 * the origin Supabase should redirect to (for example when the app is served
 * behind a proxy or from a fixed custom domain).
 */
export function getSiteOrigin(location = typeof window === 'undefined' ? null : window.location) {
  // A production .env must not send local development sign-ins to the deployed app.
  if (location && ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
    return location.origin;
  }
  const configured = (process.env.REACT_APP_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  return location?.origin || '';
}

/**
 * Absolute URL Supabase sends the browser back to after Google sign-in.
 *
 * Every value this function can produce for an environment MUST be listed in
 * Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs.
 * A `*` wildcard does not cross `/`, so `https://app.example/*` does NOT match
 * `/auth/callback` — use the exact URL or `/**`.
 */
export function getOAuthRedirectUrl() {
  return `${getSiteOrigin()}${OAUTH_CALLBACK_PATH}`;
}
