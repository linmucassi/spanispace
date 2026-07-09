// Service-role Supabase client for server-only cron/scripts. Bypasses RLS —
// never import this from client-side or request-handler code.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any>;

let _admin: AdminClient | null = null;

export function getSupabaseAdmin(): AdminClient {
  if (_admin) return _admin;

  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace(/\/rest\/v1\/?$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add them to your environment. Get the service role key from ' +
      'Supabase Dashboard > Settings > API.'
    );
  }

  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}
