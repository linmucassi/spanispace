'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function TrainingActions({
  trainingId,
  currentStatus,
}: {
  trainingId: string;
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

    const newStatus = currentStatus === 'cancelled' ? 'active' : 'cancelled';
    const { error: dbError } = await supabase
      .from('trainings')
      .update({ status: newStatus })
      .eq('id', trainingId);

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
        href={`/company/training/${trainingId}/edit`}
        className="text-xs font-bold text-indigo-600 hover:underline"
      >
        Edit
      </Link>
      {currentStatus !== 'completed' && (
        <button
          onClick={toggleStatus}
          disabled={updating}
          className={`text-xs font-bold hover:underline disabled:opacity-50 ${
            currentStatus === 'cancelled' ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          {currentStatus === 'cancelled' ? 'Reactivate' : 'Cancel'}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
