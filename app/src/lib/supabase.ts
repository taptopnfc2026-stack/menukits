import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vogadmkyyuvamjfvcdeo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0GvqWFGHxRdpTcyq2QtZrw_TMljIuxP';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/** Get current session (for API calls) */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
