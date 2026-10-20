'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageSquare } from 'lucide-react';
import { scanText, explainContactScan } from '@/lib/services/contactGuard';
import { PROVINCES } from '@/lib/services/config';
import Select from '@/components/ui/Select';

export type OpenRequest = { id: string; category_slug: string; description: string };

const input =
  'block w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white';

function Warning({ value }: { value: string }) {
  const scan = scanText(value);
  return scan.blocked ? <p className="text-xs text-amber-700 mt-1">{explainContactScan(scan.reasons)}</p> : null;
}

export default function RequestQuoteForm({
  providerId,
  providerName,
  categories,
  openRequests,
  defaultProvince,
}: {
  providerId: string;
  providerName: string;
  categories: { slug: string; name: string }[];
  openRequests: OpenRequest[];
  defaultProvince?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? '');
  const matching = openRequests.filter((r) => r.category_slug === categorySlug);
  const [requestId, setRequestId] = useState<string>('new');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState(defaultProvince ?? '');
  const [city, setCity] = useState('');
  const [suburb, setSuburb] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [timing, setTiming] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reusing = requestId !== 'new' && matching.some((r) => r.id === requestId);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/services/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          category_slug: categorySlug,
          message,
          ...(reusing
            ? { request_id: requestId }
            : { description, province, city, suburb, preferred_start: start || null, preferred_end: end || null, timing_notes: timing }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not send your request.');
        return;
      }
      router.push(`/candidate/services/chat/${data.threadId}`);
    } catch {
      setError('Could not reach Spanispace. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 flex items-center justify-center gap-2"
      >
        <MessageSquare className="h-4 w-4" aria-hidden /> Request a quote
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="font-semibold text-ink-900">Request a quote from {providerName}</p>

      <Select
        label="Service"
        value={categorySlug}
        onChange={(v) => { setCategorySlug(v); setRequestId('new'); }}
        options={categories.map((c) => ({ value: c.slug, label: c.name }))}
      />

      {matching.length > 0 && (
        <div>
          <Select
            label="Add to one of your open requests?"
            value={requestId}
            onChange={setRequestId}
            options={[
              { value: 'new', label: 'No, this is a new job' },
              ...matching.map((r) => ({ value: r.id, label: r.description.length > 60 ? `${r.description.slice(0, 60)}…` : r.description })),
            ]}
          />
          <span className="text-xs text-ink-400">Adding providers to the same request lets you compare quotes side by side.</span>
        </div>
      )}

      {!reusing && (
        <>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Describe the job</span>
            <textarea className={input} rows={4} required minLength={10} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Paint the lounge and 2 bedrooms, walls only, about 35 m². I have the paint." />
            <Warning value={description} />
          </label>
          {/* One column inside the narrow sidebar on large screens. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            <Select
              label="Province"
              value={province}
              onChange={setProvince}
              options={[{ value: '', label: 'Choose a province' }, ...PROVINCES.map((p) => ({ value: p, label: p }))]}
            />
            <label className="block">
              <span className="text-xs font-medium text-ink-500">Town / city</span>
              <input className={input} required value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-500">Suburb</span>
              <input className={input} value={suburb} onChange={(e) => setSuburb(e.target.value)} />
            </label>
          </div>
          <p className="text-xs text-ink-400">Only your suburb is shared now. Your full address is shared once a booking is confirmed.</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-medium text-ink-500">Preferred start</span>
              <input type="date" min={today} className={input} value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-500">Finish by</span>
              <input type="date" min={start || today} className={input} value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Timing notes (optional)</span>
            <input className={input} maxLength={200} value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="e.g. weekdays only, after 9am" />
          </label>
        </>
      )}

      <label className="block">
        <span className="text-xs font-medium text-ink-500">Message to {providerName} (optional)</span>
        <textarea className={input} rows={2} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Anything else they should know?" />
        <Warning value={message} />
      </label>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send request
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-600">Cancel</button>
      </div>
      <p className="text-xs text-ink-400">Free to ask. A R10 booking fee applies only when you both agree and book.</p>
    </form>
  );
}
