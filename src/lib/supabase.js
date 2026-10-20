import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabasePublicKey = process.env.REACT_APP_SUPABASE_PUBLIC_KEY;

if (!supabaseUrl || !supabasePublicKey) {
  throw new Error('Supabase environment variables are not configured');
}

export const supabase = createClient(supabaseUrl, supabasePublicKey);
