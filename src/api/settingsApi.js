import { supabase } from '../lib/supabase';

export async function fetchProfileSettings(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('timezone, settings')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function saveProfileSettings(userId, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('timezone, settings')
    .single();
  if (error) throw error;
  return data;
}