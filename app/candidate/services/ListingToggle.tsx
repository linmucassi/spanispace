'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Direct update is safe here: guard_service_provider() in
// supabase/add-service-marketplace.sql refuses listing_active = true unless
// the provider is verified with an in-date police clearance.
export default function ListingToggle({
  providerId,
  initialActive,
  disabled,
}: {
  providerId: string;
  initialActive: boolean;
  disabled?: boolean;
}) {
  const [active, setActive] = useState(initialActive && !disabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const next = !active;
    const { error: updateError } = await supabase
      .from('service_providers')
      .update({ listing_active: next })
      .eq('id', providerId);
    if (updateError) setError(updateError.message);
    else setActive(next);
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">Listing {active ? 'on' : 'off'}</p>
        <p className="text-xs text-slate-500">
          {active ? 'Customers can find you and send you requests.' : 'You are hidden from search and won’t receive new requests.'}
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label="Listing visible to customers"
        onClick={toggle}
        disabled={busy || disabled}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${active ? 'bg-green-600' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
