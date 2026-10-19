import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;
let warned = false;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!url || !anonKey) {
    if (!warned) {
      console.warn('Supabase env vars missing — booking/auth disabled.');
      warned = true;
    }
    return null;
  }
  client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export const supabase = getSupabase();
