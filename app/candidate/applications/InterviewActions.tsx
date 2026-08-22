'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  interviewId: string;
  status: string;
}

export default function InterviewActions({ interviewId, status }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const respond = async (newStatus: 'confirmed' | 'declined') => {
    setUpdating(true);
    const supabase = createClient();
    if (!supabase) { setUpdating(false); return; }
    await supabase.from('interviews').update({ status: newStatus }).eq('id', interviewId);
    setUpdating(false);
    router.refresh();
  };

  if (status !== 'proposed') return null;

  return (
    <div className="flex gap-2 mt-1">
      <button
        onClick={() => respond('confirmed')}
        disabled={updating}
        className="px-2 py-1 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
      >
        Confirm
      </button>
      <button
        onClick={() => respond('declined')}
        disabled={updating}
        className="px-2 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
