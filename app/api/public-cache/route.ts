// Clears the cached public pages after an admin or a company changes a job or
// a uni application. The home page, /university and every job page are cached
// and shared by all visitors (see lib/supabase/anon.ts), so without this a job
// an admin rejects or a company closes would stay public until the cache runs
// out. Called by lib/publicCache.ts from the screens that write those tables.

import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  // Only the roles that can change public listings. Anyone else could only use
  // this to make every visitor's next page view a fresh render.
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'company') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  // expire: 0 drops the cached job list now rather than serving it once more.
  revalidateTag('public-jobs', { expire: 0 });
  revalidatePath('/');
  revalidatePath('/jobs/[id]', 'layout');
  revalidatePath('/university');
  return NextResponse.json({ ok: true });
}
