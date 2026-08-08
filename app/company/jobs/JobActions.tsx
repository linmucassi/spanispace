'use client';

import { useState } from 'react';
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
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const toggleStatus = async () => {
    setError('');
    setUpdating(true);
    const supabase = createClient();
    if (!supabase) {
      setUpdating(false);
      return;
    }

    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    const { error: dbError } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId);

    setUpdating(false);
    if (dbError) {
      setError('Failed to update status.');
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/company/jobs/${jobId}/edit`}
        className="text-xs font-bold text-brand-600 hover:underline"
      >
        Edit
      </Link>
      <button
        onClick={toggleStatus}
        disabled={updating}
        className={`text-xs font-bold hover:underline disabled:opacity-50 ${
          currentStatus === 'active'
            ? 'text-amber-600'
            : 'text-emerald-600'
        }`}
      >
        {currentStatus === 'active' ? 'Close' : 'Reopen'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
