import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabasePublicKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabasePublicKey) {
  throw new Error('Supabase environment variables are not configured');
}

export const supabase = createClient(supabaseUrl, supabasePublicKey, {
  auth: {
    // PKCE keeps the tokens out of the address bar: Supabase redirects to
    // /auth/callback?code=... and the SDK swaps that code for a session using the
    // verifier it stored in localStorage when sign-in started. The implicit flow
    // (default) instead puts access_token/refresh_token in the URL hash, which
    // leaks them into history and breaks whenever the hash is dropped in transit.
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
