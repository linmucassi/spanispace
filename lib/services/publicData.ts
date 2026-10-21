// Public (S2) reads for Spanispace Services. Everything here goes through the
// safe-columns views in supabase/add-service-marketplace.sql PART F, never the
// base tables. Each fetcher degrades gracefully if the migration hasn't run
// yet, so the home page and /services still render (category tiles from the
// fallback list, "providers coming soon" instead of an error).

import { createClient } from '@supabase/supabase-js';
import { createServerSupabase } from '@/lib/supabase/server';
import type { PaymentMethods, PricingUnit } from '@/lib/services/config';

// Cookie-free anon client for the public reads, so pages using them stay
// cacheable (createServerSupabase() reads cookies, which forces dynamic
// rendering). Only the signed-in details below need the user's session.
function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type ServiceCategory = { slug: string; name: string; requires_qualification: boolean };

// Mirrors the seed in add-service-marketplace.sql. Only used when the
// service_categories table isn't there yet.
export const FALLBACK_CATEGORIES: ServiceCategory[] = [
  ['cleaning', 'Cleaning'], ['laundry', 'Laundry & ironing'], ['painting', 'Painting'],
  ['plumbing', 'Plumbing', true], ['electrical', 'Electrical', true], ['gas', 'Gas installation & repair', true],
  ['solar', 'Solar & backup power', true], ['gardening', 'Gardening & landscaping'], ['handyman', 'Handyman & small repairs'],
  ['carpentry', 'Carpentry & furniture'], ['tiling', 'Tiling'], ['building', 'Building, brickwork & paving'],
  ['roofing', 'Roofing & waterproofing'], ['welding', 'Welding & burglar bars'], ['appliance-repair', 'Appliance repair'],
  ['moving', 'Moving & delivery help'], ['pool', 'Pool cleaning'], ['car-wash', 'Car wash & valet'],
  ['window-cleaning', 'Window cleaning'], ['pest-control', 'Pest control', true], ['childminding', 'Childminding & babysitting'],
  ['elderly-care', 'Elderly & home care'], ['cooking', 'Cooking & catering'], ['sewing', 'Sewing & alterations'],
  ['hair-beauty', 'Hair & beauty (home visits)'], ['tech-help', 'Phone, computer & TV help'], ['dstv-install', 'DSTV & aerial installation'],
  ['security', 'Security guarding', true], ['tutoring', 'Tutoring & lessons'],
].map(([slug, name, requires]) => ({ slug: slug as string, name: name as string, requires_qualification: requires === true }));

// The ones most people come for, shown first on the home page.
export const POPULAR_SLUGS = ['cleaning', 'laundry', 'painting', 'plumbing', 'gardening', 'handyman', 'electrical', 'moving'];

export type ProviderCard = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  province: string | null;
  city: string | null;
  suburb: string | null;
  travel_radius_km: number | null;
  payment_methods: PaymentMethods;
  verified_at: string | null;
  rating_avg: number | null;
  jobs_completed: number;
  category_slugs: string[];
  category_names: string[];
  from_price_cents: number | null;
  from_price_unit: PricingUnit | null;
};

export type RateCardRow = {
  category_slug: string;
  category_name: string;
  category_sort: number;
  years_experience: number | null;
  description: string | null;
  label: string;
  unit: PricingUnit;
  price_cents: number;
  minimum_charge_cents: number | null;
  notes: string | null;
  sort_order: number;
};

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  const supabase = anonClient();
  if (!supabase) return FALLBACK_CATEGORIES;
  const { data, error } = await supabase
    .from('service_categories')
    .select('slug, name, requires_qualification')
    .eq('active', true)
    .order('sort_order');
  if (error || !data || data.length === 0) return FALLBACK_CATEGORIES;
  return data;
}

export async function fetchProviderCards(filters: {
  category?: string;
  province?: string;
  payment?: 'cash' | 'online';
}): Promise<{ cards: ProviderCard[]; available: boolean }> {
  const supabase = anonClient();
  if (!supabase) return { cards: [], available: false };

  let query = supabase.from('service_provider_cards').select('*').limit(60);
  if (filters.category) query = query.contains('category_slugs', [filters.category]);
  if (filters.province) query = query.eq('province', filters.province);
  if (filters.payment === 'cash') query = query.in('payment_methods', ['cash', 'cash_or_online']);
  if (filters.payment === 'online') query = query.in('payment_methods', ['online', 'cash_or_online']);
  query = query.order('jobs_completed', { ascending: false }).order('verified_at', { ascending: true });

  const { data, error } = await query;
  if (error) {
    // 42P01/PGRST205: the view doesn't exist yet (migration not run). That's
    // an expected state before launch, so only a warning; anything else is a
    // real failure.
    const notCreatedYet = error.code === 'PGRST205' || error.code === '42P01';
    (notCreatedYet ? console.warn : console.error)('[services] provider cards unavailable:', error.code, error.message);
    return { cards: [], available: false };
  }
  return { cards: (data ?? []) as ProviderCard[], available: true };
}

export async function fetchProviderCard(id: string): Promise<ProviderCard | null> {
  const supabase = anonClient();
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase.from('service_provider_cards').select('*').eq('id', id).maybeSingle();
  return (data as ProviderCard | null) ?? null;
}

// Signed-in only (the views behind these are granted to authenticated, not
// anon). Returns null for signed-out visitors so the page shows the summary.
export async function fetchProviderDetails(id: string): Promise<{
  signedIn: boolean;
  bio: string | null;
  availability: Record<string, boolean | string>;
  rates: RateCardRow[];
} | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: rates }] = await Promise.all([
    supabase.from('service_provider_profiles').select('bio, availability').eq('id', id).maybeSingle(),
    supabase
      .from('service_provider_rate_cards')
      .select('category_slug, category_name, category_sort, years_experience, description, label, unit, price_cents, minimum_charge_cents, notes, sort_order')
      .eq('provider_id', id),
  ]);

  return {
    signedIn: true,
    bio: profile?.bio ?? null,
    availability: (profile?.availability as Record<string, boolean | string>) ?? {},
    rates: ((rates ?? []) as RateCardRow[]).sort((a, b) => a.category_sort - b.category_sort || a.sort_order - b.sort_order),
  };
}
