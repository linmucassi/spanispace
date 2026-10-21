import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, Lock, MapPin, MessageSquare, Star } from 'lucide-react';
import { PAYMENT_METHOD_LABELS, UNIT_LABELS, WEEKDAYS, WEEKDAY_LABELS, formatRand } from '@/lib/services/config';
import { fetchProviderCard, fetchProviderDetails, type RateCardRow } from '@/lib/services/publicData';
import { initials, verifiedLabel } from '@/components/services/ProviderCardView';
import RequestQuoteForm, { type OpenRequest } from '@/components/services/RequestQuoteForm';
import { createServerSupabase } from '@/lib/supabase/server';

// Who is looking, for the request panel: signed out, the provider looking at
// their own listing, or a potential customer (with their open requests, so a
// second provider can be added to the same job for comparison).
async function viewerContext(providerId: string) {
  const supabase = await createServerSupabase();
  if (!supabase) return { kind: 'signed_out' as const };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kind: 'signed_out' as const };

  const [{ data: ownProvider }, { data: userRow }, { data: requests }] = await Promise.all([
    supabase.from('service_providers').select('id').eq('user_id', user.id).maybeSingle(),
    supabase.from('users').select('role').eq('id', user.id).maybeSingle(),
    supabase
      .from('service_requests')
      .select('id, description, category:service_categories(slug)')
      .eq('requester_user_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
  ]);
  if (ownProvider?.id === providerId) return { kind: 'own' as const };
  if (userRow?.role === 'company') return { kind: 'company' as const };

  const openRequests: OpenRequest[] = (requests ?? []).map((r) => {
    const category = Array.isArray(r.category) ? r.category[0] : r.category;
    return { id: r.id, description: r.description, category_slug: category?.slug ?? '' };
  });
  return { kind: 'customer' as const, openRequests };
}

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const card = await fetchProviderCard(id);
  if (!card) return { title: 'PieceJobs provider | Spanispace' };
  return {
    title: `${card.display_name}: ${card.category_names.slice(0, 2).join(', ')} | Spanispace PieceJobs`,
    description: card.headline ?? undefined,
  };
}

export default async function ProviderPage({ params }: { params: Params }) {
  const { id } = await params;
  const [card, details, viewer] = await Promise.all([fetchProviderCard(id), fetchProviderDetails(id), viewerContext(id)]);
  if (!card) notFound();

  const area = [card.suburb, card.city, card.province].filter(Boolean).join(', ');
  const ratesByCategory = new Map<string, RateCardRow[]>();
  for (const row of details?.rates ?? []) {
    if (!ratesByCategory.has(row.category_name)) ratesByCategory.set(row.category_name, []);
    ratesByCategory.get(row.category_name)!.push(row);
  }
  const workDays = WEEKDAYS.filter((d) => details?.availability?.[d] === true);
  const availabilityNotes = typeof details?.availability?.notes === 'string' ? details.availability.notes : null;

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="text-sm text-ink-500 mb-6" aria-label="Breadcrumb">
          <Link href="/piecejobs" className="hover:text-brand-600">PieceJobs</Link>
          {card.category_slugs[0] && (
            <> <span aria-hidden>/</span> <Link href={`/piecejobs/${card.category_slugs[0]}`} className="hover:text-brand-600">{card.category_names[0]}</Link></>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-4">
              {card.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover shrink-0" />
              ) : (
                <span className="h-20 w-20 rounded-full bg-brand-50 text-brand-700 text-2xl font-bold flex items-center justify-center shrink-0">
                  {initials(card.display_name)}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-ink-900">{card.display_name}</h1>
                {card.headline && <p className="text-ink-600 mt-1">{card.headline}</p>}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {card.category_names.map((name, i) => (
                    <Link key={name} href={`/piecejobs/${card.category_slugs[i]}`} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700 hover:text-brand-700">
                      {name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {details ? (
              <>
                {details.bio && (
                  <section>
                    <h2 className="text-lg font-semibold text-ink-900 mb-2">About</h2>
                    <p className="text-ink-600 whitespace-pre-line">{details.bio}</p>
                  </section>
                )}

                <section>
                  <h2 className="text-lg font-semibold text-ink-900 mb-3">Rate card</h2>
                  <p className="text-xs text-ink-500 mb-3">Prices are a guide. You agree the final price with the provider in the chat.</p>
                  <div className="space-y-4">
                    {Array.from(ratesByCategory.entries()).map(([categoryName, rows]) => (
                      <div key={categoryName} className="rounded-2xl border border-ink-100 p-4">
                        <p className="font-semibold text-ink-900">
                          {categoryName}
                          {rows[0].years_experience != null && <span className="text-ink-400 font-normal text-sm"> · {rows[0].years_experience} years experience</span>}
                        </p>
                        {rows[0].description && <p className="text-sm text-ink-600 mt-1">{rows[0].description}</p>}
                        <ul className="mt-3 divide-y divide-ink-100">
                          {rows.map((r, i) => (
                            <li key={i} className="py-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                              <span className="text-ink-800">
                                {r.label}
                                {r.notes && <span className="block text-xs text-ink-500">{r.notes}</span>}
                              </span>
                              <span className="text-ink-900">
                                <strong>{formatRand(r.price_cents)}</strong> <span className="text-ink-500">{UNIT_LABELS[r.unit]}</span>
                                {r.minimum_charge_cents ? <span className="block text-xs text-ink-400 text-right">minimum {formatRand(r.minimum_charge_cents)}</span> : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                {(workDays.length > 0 || availabilityNotes) && (
                  <section>
                    <h2 className="text-lg font-semibold text-ink-900 mb-2">Availability</h2>
                    {workDays.length > 0 && <p className="text-ink-600">{workDays.map((d) => WEEKDAY_LABELS[d]).join(', ')}</p>}
                    {availabilityNotes && <p className="text-sm text-ink-500 mt-1">{availabilityNotes}</p>}
                  </section>
                )}
              </>
            ) : (
              <section className="rounded-2xl border border-ink-100 bg-ink-50/50 p-6 text-center">
                <Lock className="h-6 w-6 text-ink-400 mx-auto" aria-hidden />
                <p className="font-semibold text-ink-900 mt-2">Sign in to see the full rate card</p>
                <p className="text-sm text-ink-500 mt-1">Free account. See every price, availability, and message the provider.</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                  <Link href="/login" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Sign in</Link>
                  <Link href="/register" className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-bold text-ink-800 hover:border-brand-500">Create an account</Link>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-ink-100 p-5 space-y-3 text-sm">
              {card.from_price_cents != null && card.from_price_unit && (
                <p className="text-ink-900 text-base">From <strong>{formatRand(card.from_price_cents)}</strong> <span className="text-ink-500 text-sm">{UNIT_LABELS[card.from_price_unit]}</span></p>
              )}
              {area && <p className="text-ink-600 flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />{area}{card.travel_radius_km ? `, travels up to ${card.travel_radius_km} km` : ''}</p>}
              <p className="text-ink-600 flex items-start gap-2"><BadgeCheck className="h-4 w-4 mt-0.5 text-green-600 shrink-0" aria-hidden />{verifiedLabel(card.verified_at)}</p>
              <p className="text-ink-600 flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" aria-hidden />
                {card.rating_avg != null ? `${Number(card.rating_avg).toFixed(1)} from ${card.jobs_completed} jobs` : 'New on Spanispace, no reviews yet'}
              </p>
              <p className="text-ink-600">Paid for the service: <strong>{PAYMENT_METHOD_LABELS[card.payment_methods]}</strong></p>

              {viewer.kind === 'customer' && (
                <RequestQuoteForm
                  providerId={card.id}
                  providerName={card.display_name.split(' ')[0]}
                  categories={card.category_slugs.map((slug, i) => ({ slug, name: card.category_names[i] }))}
                  openRequests={viewer.openRequests}
                  defaultProvince={card.province}
                />
              )}
              {viewer.kind === 'signed_out' && (
                <Link href="/login" className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" aria-hidden /> Sign in to request a quote
                </Link>
              )}
              {viewer.kind === 'own' && (
                <p className="rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-600">This is how customers see your listing. <Link href="/candidate/piecejobs" className="underline">Manage it</Link>.</p>
              )}
              {viewer.kind === 'company' && (
                <p className="rounded-xl bg-ink-50 px-4 py-3 text-xs text-ink-600">Booking services as a company is coming soon. For now, please use a personal account.</p>
              )}
              <p className="text-xs text-ink-500">Contact details stay private until a booking is confirmed. Agreeing a price and booking (R10 booking fee) open soon. For now, you can chat and compare quotes.</p>
            </div>
            <p className="text-xs text-ink-400">
              Providers are independent and not Spanispace employees. Spanispace checks identity and police clearance at
              enrolment but does not guarantee the quality of a service. <Link href="/piecejobs/provider-agreement" className="underline">Learn more</Link>.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
