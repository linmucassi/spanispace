'use client';

import { createClient } from '@/lib/supabase/client';

// Fire-and-forget analytics event, deduped per browser tab session so a
// re-render or back/forward navigation doesn't inflate counts.
export async function logJobEvent(
  table: 'job_views' | 'application_starts',
  jobId: string
) {
  const dedupeKey = `spanispace:${table}:${jobId}`;
  if (typeof window !== 'undefined' && sessionStorage.getItem(dedupeKey)) {
    return;
  }

  const supabase = createClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.from(table).insert({
    job_id: jobId,
    viewer_id: user?.id ?? null,
  });

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(dedupeKey, '1');
  }
}
