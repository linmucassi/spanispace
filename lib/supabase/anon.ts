// Cookie-free anon client for public reads. createServerSupabase() reads
// cookies, and touching cookies makes Next render the page on every request,
// which silently cancels a page's `revalidate`. Public pages read through this
// instead so they stay cacheable. RLS sees the anon role, the same view a
// signed-out visitor gets.
import { createClient } from '@supabase/supabase-js';

export function createAnonSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
