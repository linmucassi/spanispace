'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function JobActions({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  const toggleStatus = async () => {
    const supabase = createClient();
    if (!supabase) return;

    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/company/jobs/${jobId}/edit`}
        className="text-xs font-bold text-indigo-600 hover:underline"
      >
        Edit
      </Link>
      <button
        onClick={toggleStatus}
        className={`text-xs font-bold hover:underline ${
          currentStatus === 'active'
            ? 'text-amber-600'
            : 'text-emerald-600'
        }`}
      >
        {currentStatus === 'active' ? 'Close' : 'Reopen'}
      </button>
    </div>
  );
}
