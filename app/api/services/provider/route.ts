// Service provider enrolment (Spanispace Services, S1). One endpoint, one
// action per wizard step, so every write goes through the same server-side
// checks: contact-detail scanning (lib/services/contactGuard.ts), SA ID ->
// date of birth (the ID number itself is never stored), 18+, and the
// completeness check on submit. Runs as the signed-in user, so RLS and the
// guard triggers in supabase/add-service-marketplace.sql still apply --
// this route can't grant anything the database wouldn't.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { scanFields, explainContactScan } from '@/lib/services/contactGuard';
import { parseSaId, ageOn } from '@/lib/services/saId';
import {
  MIN_PROVIDER_AGE,
  PROVINCES,
  SERVICE_TERMS_VERSION,
  WEEKDAYS,
  requiredDocTypes,
  PROVIDER_DOC_LABELS,
  type PaymentMethods,
  type PricingUnit,
} from '@/lib/services/config';

type Supabase = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

const PAYMENT_METHODS: PaymentMethods[] = ['cash', 'online', 'cash_or_online'];

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

function str(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

function contactError(fields: Record<string, string | null | undefined>) {
  const hits = scanFields(fields);
  if (hits.length === 0) return null;
  return bad(`${explainContactScan(hits[0].reasons)} (Field: ${hits[0].field})`, 422);
}

async function getOrCreateProvider(supabase: Supabase, userId: string) {
  const { data: existing } = await supabase
    .from('service_providers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return { provider: existing, error: null };

  const { data: candidate } = await supabase
    .from('candidate_profiles')
    .select('id, location')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: created, error } = await supabase
    .from('service_providers')
    .insert({ user_id: userId, candidate_profile_id: candidate?.id ?? null, city: candidate?.location ?? null })
    .select('*')
    .single();
  return { provider: created, error };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const action = typeof body?.action === 'string' ? body.action : '';

  const supabase = await createServerSupabase();
  if (!supabase) return bad('Service unavailable.', 503);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return bad('Please sign in first.', 401);

  const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
  if (userRow?.role !== 'candidate') {
    return bad('Service provider enrolment is for personal (candidate) accounts.', 403);
  }

  const { provider, error: createError } = await getOrCreateProvider(supabase, user.id);
  if (!provider) return bad(createError?.message ?? 'Could not start your enrolment.', 500);

  if (action === 'start') {
    return NextResponse.json({ ok: true, providerId: provider.id });
  }

  if (provider.verification_status === 'suspended') {
    return bad('Your provider account is suspended. Please contact Spanispace support.', 403);
  }
  // Freeze the enrolment while an admin is reviewing it, so what they
  // approve is what goes live.
  if (provider.verification_status === 'pending' && action !== 'submit') {
    return bad('Your enrolment is under review. You can make changes once the review is finished.', 409);
  }
  // Identity is what the verification was checked against.
  if (provider.verification_status === 'verified' && action === 'identity') {
    return bad('Your identity is already verified. Contact support if your details have changed.', 409);
  }

  // ---------------------------------------------------------------- profile
  if (action === 'profile') {
    const headline = str(body.headline, 120);
    const bio = str(body.bio, 2000);
    const province = str(body.province, 40);
    const city = str(body.city, 80);
    const suburb = str(body.suburb, 80);
    const radius = Number(body.travel_radius_km);
    const paymentMethods = body.payment_methods as PaymentMethods;

    if (!headline) return bad('Add a short headline, e.g. "Interior painter, 8 years experience".');
    if (!province || !PROVINCES.includes(province)) return bad('Choose your province.');
    if (!city) return bad('Add your town or city.');
    if (!Number.isInteger(radius) || radius < 0 || radius > 500) return bad('Travel distance must be between 0 and 500 km.');
    if (!PAYMENT_METHODS.includes(paymentMethods)) return bad('Choose how you want to be paid for your services.');

    const rawAvailability = (body.availability ?? {}) as Record<string, unknown>;
    const availability: Record<string, boolean | string> = {};
    for (const day of WEEKDAYS) availability[day] = rawAvailability[day] === true;
    const availabilityNotes = str(rawAvailability.notes, 200);
    if (availabilityNotes) availability.notes = availabilityNotes;

    const blocked = contactError({ headline, bio, city, suburb, 'availability notes': availabilityNotes });
    if (blocked) return blocked;

    const { error } = await supabase
      .from('service_providers')
      .update({ headline, bio, province, city, suburb, travel_radius_km: radius, payment_methods: paymentMethods, availability })
      .eq('id', provider.id);
    if (error) return bad(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  // --------------------------------------------------------------- identity
  if (action === 'identity') {
    const idKind = body.id_kind;
    let dateOfBirth: string | null = null;

    if (idKind === 'sa_id') {
      const parsed = parseSaId(String(body.sa_id_number ?? ''));
      if (!parsed.ok) return bad(parsed.error);
      dateOfBirth = parsed.dateOfBirth;
    } else if (idKind === 'passport') {
      const dob = String(body.date_of_birth ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(Date.parse(dob))) return bad('Enter your date of birth.');
      dateOfBirth = dob;
    } else {
      return bad('Choose SA ID or passport.');
    }

    if (ageOn(dateOfBirth) < MIN_PROVIDER_AGE) {
      return bad(`You must be ${MIN_PROVIDER_AGE} or older to offer services on Spanispace.`);
    }

    const { error } = await supabase
      .from('service_providers')
      .update({ id_kind: idKind, date_of_birth: dateOfBirth })
      .eq('id', provider.id);
    if (error) return bad(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  // --------------------------------------------------------------- services
  if (action === 'services') {
    type RateInput = { label?: unknown; unit?: unknown; price_rands?: unknown; minimum_rands?: unknown; notes?: unknown };
    type ServiceInput = { category_id?: unknown; years_experience?: unknown; description?: unknown; rates?: RateInput[] };
    const services: ServiceInput[] = Array.isArray(body.services) ? body.services : [];
    if (services.length === 0) return bad('Add at least one service.');
    if (services.length > 15) return bad('You can list up to 15 services.');

    const { data: unitRows } = await supabase.from('service_category_units').select('category_id, unit');
    const allowedUnits = new Map<string, Set<string>>();
    for (const row of unitRows ?? []) {
      if (!allowedUnits.has(row.category_id)) allowedUnits.set(row.category_id, new Set());
      allowedUnits.get(row.category_id)!.add(row.unit);
    }

    const cleaned: {
      category_id: string;
      years_experience: number | null;
      description: string | null;
      rates: { label: string; unit: PricingUnit; price_cents: number; minimum_charge_cents: number | null; notes: string | null }[];
    }[] = [];
    const seen = new Set<string>();

    for (const service of services) {
      const categoryId = String(service.category_id ?? '');
      const units = allowedUnits.get(categoryId);
      if (!units) return bad('One of your services has an unknown category.');
      if (seen.has(categoryId)) return bad('Each category can only be listed once.');
      seen.add(categoryId);

      const years = service.years_experience === '' || service.years_experience == null ? null : Number(service.years_experience);
      if (years !== null && (!Number.isInteger(years) || years < 0 || years > 60)) return bad('Years of experience must be between 0 and 60.');
      const description = str(service.description, 1000);

      const rates = Array.isArray(service.rates) ? service.rates : [];
      if (rates.length === 0) return bad('Every service needs at least one price on its rate card.');
      if (rates.length > 10) return bad('A service can have up to 10 prices.');

      const cleanRates = [];
      for (const rate of rates) {
        const label = str(rate.label, 80);
        const unit = String(rate.unit ?? '') as PricingUnit;
        const price = Number(rate.price_rands);
        const minimum = rate.minimum_rands === '' || rate.minimum_rands == null ? null : Number(rate.minimum_rands);
        const notes = str(rate.notes, 200);
        if (!label) return bad('Every price needs a name, e.g. "Interior walls".');
        if (!units.has(unit)) return bad(`"${label}" uses a unit that isn't available for that category.`);
        if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) return bad(`Enter a valid price for "${label}".`);
        if (minimum !== null && (!Number.isFinite(minimum) || minimum <= 0)) return bad(`Enter a valid minimum charge for "${label}".`);
        const blocked = contactError({ [`price "${label}"`]: label, [`notes on "${label}"`]: notes });
        if (blocked) return blocked;
        cleanRates.push({
          label,
          unit,
          price_cents: Math.round(price * 100),
          minimum_charge_cents: minimum === null ? null : Math.round(minimum * 100),
          notes,
        });
      }

      const blocked = contactError({ 'service description': description });
      if (blocked) return blocked;
      cleaned.push({ category_id: categoryId, years_experience: years, description, rates: cleanRates });
    }

    const { data: existing } = await supabase
      .from('provider_services')
      .select('id, category_id')
      .eq('provider_id', provider.id);
    const existingByCategory = new Map((existing ?? []).map((s) => [s.category_id, s.id]));

    // Remove categories the provider dropped.
    const removed = (existing ?? []).filter((s) => !seen.has(s.category_id)).map((s) => s.id);
    if (removed.length > 0) {
      const { error } = await supabase.from('provider_services').delete().in('id', removed);
      if (error) return bad(error.message, 500);
    }

    for (const service of cleaned) {
      let serviceId = existingByCategory.get(service.category_id);
      if (serviceId) {
        // Update keeps qualification_status (the guard trigger enforces it too).
        const { error } = await supabase
          .from('provider_services')
          .update({ years_experience: service.years_experience, description: service.description })
          .eq('id', serviceId);
        if (error) return bad(error.message, 500);
        const { error: delError } = await supabase.from('provider_rates').delete().eq('provider_service_id', serviceId);
        if (delError) return bad(delError.message, 500);
      } else {
        const { data, error } = await supabase
          .from('provider_services')
          .insert({ provider_id: provider.id, category_id: service.category_id, years_experience: service.years_experience, description: service.description })
          .select('id')
          .single();
        if (error || !data) return bad(error?.message ?? 'Could not save a service.', 500);
        serviceId = data.id;
      }

      const { error: rateError } = await supabase
        .from('provider_rates')
        .insert(service.rates.map((r, i) => ({ ...r, provider_service_id: serviceId, sort_order: i })));
      if (rateError) return bad(rateError.message, 500);
    }

    return NextResponse.json({ ok: true });
  }

  // ----------------------------------------------------------------- submit
  if (action === 'submit') {
    if (!['draft', 'rejected'].includes(provider.verification_status)) {
      return bad('Your enrolment has already been submitted.');
    }
    if (body.accept_terms !== true || body.popia_consent !== true) {
      return bad('Please accept the Service Provider Agreement and consent to verification.');
    }

    const problems: string[] = [];
    if (!provider.headline || !provider.province || !provider.city) problems.push('Complete your profile and service area.');
    if (!provider.date_of_birth || !provider.id_kind) problems.push('Complete the identity step.');

    const [{ data: services }, { data: documents }] = await Promise.all([
      supabase
        .from('provider_services')
        .select('id, category_id, category:service_categories(name, requires_qualification), rates:provider_rates(id)')
        .eq('provider_id', provider.id),
      supabase
        .from('provider_documents')
        .select('doc_type, category_id, status')
        .eq('provider_id', provider.id)
        .neq('status', 'rejected'),
    ]);

    if (!services || services.length === 0) problems.push('Add at least one service with prices.');
    for (const s of services ?? []) {
      const category = Array.isArray(s.category) ? s.category[0] : s.category;
      if (!s.rates || s.rates.length === 0) problems.push(`Add prices for ${category?.name ?? 'each service'}.`);
      if (category?.requires_qualification && !(documents ?? []).some((d) => d.doc_type === 'trade_certificate' && d.category_id === s.category_id)) {
        problems.push(`Upload your trade certificate for ${category.name}.`);
      }
    }

    const haveTypes = new Set((documents ?? []).map((d) => d.doc_type));
    for (const docType of requiredDocTypes(provider.id_kind)) {
      if (!haveTypes.has(docType)) problems.push(`Upload your ${PROVIDER_DOC_LABELS[docType]}.`);
    }

    if (problems.length > 0) return NextResponse.json({ error: 'Your enrolment is not complete yet.', problems }, { status: 422 });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('service_providers')
      .update({
        verification_status: 'pending',
        terms_version: SERVICE_TERMS_VERSION,
        terms_accepted_at: now,
        popia_consent_at: now,
      })
      .eq('id', provider.id);
    if (error) return bad(error.message, 500);
    return NextResponse.json({ ok: true });
  }

  return bad('Unknown action.');
}
