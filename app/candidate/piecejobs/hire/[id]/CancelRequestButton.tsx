'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirm } from '@/components/useConfirm';

export default function CancelRequestButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!(await confirm('Cancel this request? Every conversation on it will be closed.'))) return;
    setBusy(true);
    const res = await fetch(`/api/services/requests/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? 'Could not cancel the request.'); return; }
    router.refresh();
  }

  return (
    <>
      {ConfirmDialog}
      <button type="button" onClick={cancel} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-medium text-ink-500 hover:text-red-600 disabled:opacity-50">
        Cancel request
      </button>
      {error && <p className="basis-full text-xs text-red-700">{error}</p>}
    </>
  );
}
