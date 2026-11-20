import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabasePublicKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabasePublicKey) {
  throw new Error('Supabase environment variables are not configured');
}

export const supabase = createClient(supabaseUrl, supabasePublicKey, {
  auth: {
    // Using implicit flow: tokens arrive in the URL hash (#access_token=...&type=bearer).
    // PKCE flow caused "OAuth state parameter missing" errors in this setup because
    // the PKCE code-verifier stored in localStorage was lost between the OAuth
    // initiation and the callback (common in SPAs with client-side routing).
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
