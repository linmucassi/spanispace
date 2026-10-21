import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EnrolWizard, { type CategoryOption, type EnrolState } from './EnrolWizard';
import type { PricingUnit } from '@/lib/services/config';

export default async function ServiceEnrolPage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: categories }, { data: units }, { data: provider }] = await Promise.all([
    supabase
      .from('service_categories')
      .select('id, slug, name, requires_qualification, qualification_hint')
      .eq('active', true)
      .order('sort_order'),
    supabase.from('service_category_units').select('category_id, unit'),
    supabase.from('service_providers').select('*').eq('user_id', user.id).maybeSingle(),
  ]);

  if (!categories) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        PieceJobs isn&apos;t available yet. Please check back soon.
      </div>
    );
  }

  const unitsByCategory = new Map<string, PricingUnit[]>();
  for (const row of units ?? []) {
    if (!unitsByCategory.has(row.category_id)) unitsByCategory.set(row.category_id, []);
    unitsByCategory.get(row.category_id)!.push(row.unit as PricingUnit);
  }
  const categoryOptions: CategoryOption[] = categories.map((c) => ({
    ...c,
    units: unitsByCategory.get(c.id) ?? [],
  }));

  let state: EnrolState = {
    providerId: null,
    status: 'draft',
    verificationNote: null,
    profile: {
      headline: '', bio: '', province: '', city: '', suburb: '', travel_radius_km: 20,
      payment_methods: 'cash', availability: {},
    },
    idKind: null,
    hasDateOfBirth: false,
    services: [],
    documents: [],
  };

  if (provider) {
    const [{ data: services }, { data: documents }] = await Promise.all([
      supabase
        .from('provider_services')
        .select('id, category_id, years_experience, description, qualification_status, rates:provider_rates(label, unit, price_cents, minimum_charge_cents, notes, sort_order)')
        .eq('provider_id', provider.id),
      supabase
        .from('provider_documents')
        .select('id, doc_type, category_id, file_name, status, review_note, storage_path, created_at')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false }),
    ]);

    state = {
      providerId: provider.id,
      status: provider.verification_status,
      verificationNote: provider.verification_note,
      profile: {
        headline: provider.headline ?? '',
        bio: provider.bio ?? '',
        province: provider.province ?? '',
        city: provider.city ?? '',
        suburb: provider.suburb ?? '',
        travel_radius_km: provider.travel_radius_km ?? 20,
        payment_methods: provider.payment_methods,
        availability: provider.availability ?? {},
      },
      idKind: provider.id_kind,
      hasDateOfBirth: !!provider.date_of_birth,
      services: (services ?? []).map((s) => ({
        category_id: s.category_id,
        years_experience: s.years_experience == null ? '' : String(s.years_experience),
        description: s.description ?? '',
        qualification_status: s.qualification_status,
        rates: [...(s.rates ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((r) => ({
            label: r.label,
            unit: r.unit as PricingUnit,
            price_rands: String(r.price_cents / 100),
            minimum_rands: r.minimum_charge_cents == null ? '' : String(r.minimum_charge_cents / 100),
            notes: r.notes ?? '',
          })),
      })),
      documents: documents ?? [],
    };
  }

  return <EnrolWizard userId={user.id} categories={categoryOptions} initial={state} />;
}
