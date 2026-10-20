import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ListingToggle from './ListingToggle';
import {
  PAYMENT_METHOD_LABELS,
  PROVIDER_DOC_LABELS,
  UNIT_LABELS,
  formatRand,
  type PaymentMethods,
  type PricingUnit,
  type ProviderDocType,
  type ProviderStatus,
} from '@/lib/services/config';
import { BadgeCheck, Clock, FileWarning, ShieldAlert, Wrench } from 'lucide-react';

const STATUS_COPY: Record<ProviderStatus, { title: string; body: string; tone: string }> = {
  draft: {
    title: 'Enrolment not finished',
    body: 'Finish your enrolment and submit it for verification to start receiving bookings.',
    tone: 'border-slate-200 bg-white',
  },
  pending: {
    title: 'Under review',
    body: 'Spanispace is checking your documents. This usually takes a few working days. We will let you know when it is done.',
    tone: 'border-amber-200 bg-amber-50',
  },
  verified: {
    title: 'Verified',
    body: 'Your identity and police clearance have been checked. Switch your listing on when you are ready for bookings.',
    tone: 'border-green-200 bg-green-50',
  },
  rejected: {
    title: 'Changes needed',
    body: 'Your enrolment could not be approved yet. See the note below, update your enrolment and submit it again.',
    tone: 'border-red-200 bg-red-50',
  },
  suspended: {
    title: 'Suspended',
    body: 'Your provider listing is suspended. Please contact Spanispace support.',
    tone: 'border-red-200 bg-red-50',
  },
};

export default async function MyServicesPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const { submitted } = await searchParams;
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: provider } = await supabase
    .from('service_providers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!provider) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Offer your services</h1>
        <p className="text-slate-500 mb-6">
          Earn from short jobs like cleaning, laundry, painting, plumbing, gardening and more. Your candidate profile stays exactly as it is, so you can keep applying for jobs too.
        </p>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">How it works</h2>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal ml-5">
            <li>List your services and your prices (per hour, per m², per room, per load, and so on).</li>
            <li>Get verified. Upload your ID, a selfie, a SAPS police clearance certificate and proof of address. Regulated trades also need a trade certificate.</li>
            <li>Customers find you, chat with you on Spanispace and agree a price with you.</li>
            <li>The customer pays a R10 booking fee to Spanispace. You keep your full service price, paid in cash or online, depending on what you choose.</li>
          </ol>
          <p className="text-xs text-slate-500">You must be 18 or older. Your documents are private and only Spanispace admins can see them.</p>
          <Link href="/candidate/services/enrol" className="inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Start enrolment
          </Link>
        </div>
      </div>
    );
  }

  const [{ data: services }, { data: documents }, { count: strikeCount }] = await Promise.all([
    supabase
      .from('provider_services')
      .select('id, qualification_status, years_experience, category:service_categories(name, requires_qualification), rates:provider_rates(label, unit, price_cents, minimum_charge_cents, sort_order)')
      .eq('provider_id', provider.id),
    supabase
      .from('provider_documents')
      .select('id, doc_type, file_name, status, review_note, created_at')
      .eq('provider_id', provider.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('provider_strikes')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', provider.id)
      .is('removed_at', null)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const status = provider.verification_status as ProviderStatus;
  const copy = STATUS_COPY[status];
  const clearanceExpires: string | null = provider.police_clearance_expires_at;
  const clearanceExpired = clearanceExpires ? new Date(clearanceExpires) < new Date(new Date().toDateString()) : false;
  const StatusIcon = status === 'verified' ? BadgeCheck : status === 'pending' ? Clock : status === 'draft' ? Wrench : ShieldAlert;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Services</h1>
          <p className="text-slate-500 text-sm">{provider.headline ?? 'Your service listing'}</p>
        </div>
        {status !== 'pending' && status !== 'suspended' && (
          <Link href="/candidate/services/enrol" className="text-sm font-semibold text-brand-600 hover:underline">
            {status === 'draft' ? 'Continue enrolment' : 'Edit services and profile'}
          </Link>
        )}
      </div>

      {submitted && status === 'pending' && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Thanks! Your enrolment has been submitted for verification.
        </div>
      )}

      <section className={`rounded-2xl border p-5 ${copy.tone}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className="w-6 h-6 shrink-0 text-slate-700" />
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900">{copy.title}</h2>
            <p className="text-sm text-slate-600 mt-0.5">{copy.body}</p>
            {provider.verification_note && (status === 'rejected' || status === 'suspended') && (
              <p className="text-sm text-red-700 mt-2"><strong>Note from Spanispace:</strong> {provider.verification_note}</p>
            )}
            {status === 'verified' && clearanceExpires && (
              <p className={`text-xs mt-2 ${clearanceExpired ? 'text-red-700 font-semibold' : 'text-slate-500'}`}>
                {clearanceExpired
                  ? 'Your police clearance has expired, so your listing is hidden. Upload a new certificate from the enrolment page.'
                  : `Police clearance valid until ${new Date(clearanceExpires).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
              </p>
            )}
          </div>
        </div>
        {status === 'verified' && (
          <div className="mt-4 border-t border-green-200 pt-4">
            <ListingToggle providerId={provider.id} initialActive={provider.listing_active} disabled={clearanceExpired} />
          </div>
        )}
      </section>

      {(strikeCount ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <FileWarning className="w-4 h-4 mt-0.5 shrink-0" />
          You have {strikeCount} reliability strike{strikeCount === 1 ? '' : 's'} in the last 90 days. At 3, your listing is paused for review.
        </div>
      )}

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-1">Services and rate card</h2>
        <p className="text-xs text-slate-500 mb-4">Customers are paid for: {PAYMENT_METHOD_LABELS[provider.payment_methods as PaymentMethods]}</p>
        {(services ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">No services added yet.</p>
        ) : (
          <ul className="space-y-4">
            {(services ?? []).map((s) => {
              const category = Array.isArray(s.category) ? s.category[0] : s.category;
              const rates = [...(s.rates ?? [])].sort((a, b) => a.sort_order - b.sort_order);
              return (
                <li key={s.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{category?.name}</p>
                    {s.qualification_status === 'pending' && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">certificate under review</span>}
                    {s.qualification_status === 'approved' && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">certificate approved</span>}
                    {s.qualification_status === 'rejected' && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">certificate not approved</span>}
                  </div>
                  <ul className="mt-1 text-sm text-slate-600 space-y-0.5">
                    {rates.map((r, i) => (
                      <li key={i}>
                        {r.label}: <strong className="text-slate-800">{formatRand(r.price_cents)}</strong> {UNIT_LABELS[r.unit as PricingUnit]}
                        {r.minimum_charge_cents ? <span className="text-slate-400"> (minimum {formatRand(r.minimum_charge_cents)})</span> : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Verification documents</h2>
        {(documents ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(documents ?? []).map((d) => (
              <li key={d.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-slate-700">{PROVIDER_DOC_LABELS[d.doc_type as ProviderDocType]}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  d.status === 'verified' ? 'bg-green-100 text-green-700' : d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {d.status === 'pending' ? 'awaiting review' : d.status}
                </span>
                {d.status === 'rejected' && d.review_note && <span className="basis-full text-xs text-red-600">{d.review_note}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-400">
        Spanispace is a marketplace that connects customers with independent service providers. See the{' '}
        <Link href="/services/provider-agreement" className="underline">Service Provider Agreement</Link>.
      </p>
    </div>
  );
}
