import { unstable_cache } from 'next/cache';
import { createAnonSupabase } from '@/lib/supabase/anon';
import { JOBS as STATIC_JOBS } from '@/data/constants';
import { isSouthAfricanJob } from '@/lib/jobLocation';
import { isMojibake } from '@/lib/textQuality';
import type { Job } from '@/types';
import { VettedStatus } from '@/types';

type DbJob = {
  id: string;
  title: string;
  location: string;
  job_type: string;
  duration?: string | null;
  expiry_date: string;
  created_at: string;
  updated_at: string | null;
  vetted_status: string;
  status: string;
  apply_link: string | null;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  poster_name: string | null;
  apply_mode?: 'on_platform' | 'redirect';
  company_profiles: { company_name: string } | null;
};

// Reject jobs whose title or company name contains characters outside Latin-extended range
// (catches CJK, Arabic, Cyrillic, etc. that slip in from global scrapers), or mojibake of
// one of those scripts -- garbled but still entirely within the Latin range the first check
// allows through (found live 23 Aug 2026: 2 rows, both readable only after this). See
// lib/textQuality.ts. This is defense-in-depth, not the only gate -- the scraper's own
// isLatinJob() (lib/scrapers/db-writer.ts) is the primary filter at write time; this catches
// anything already in the table, or written some other way.
function isEnglishReadable(job: DbJob): boolean {
  const nonLatin = /[^\u0000-ɏ\s]/u;
  const company = job.company_profiles?.company_name ?? job.poster_name ?? '';
  if (nonLatin.test(job.title) || nonLatin.test(company)) return false;
  if (isMojibake(job.title) || isMojibake(company)) return false;
  return true;
}

function mapDbJob(row: DbJob): Job {
  const companyName =
    row.company_profiles?.company_name ?? row.poster_name ?? 'Spanispace Partner';

  return {
    id: row.id,
    role: row.title,
    company: companyName,
    location: row.location,
    type: row.job_type as Job['type'],
    duration: row.duration ?? undefined,
    applyLink: row.apply_link ?? '',
    applyMode: row.apply_mode ?? 'on_platform',
    expiryDate: row.expiry_date,
    postedDate: row.created_at,
    updatedDate: row.updated_at ?? row.created_at,
    // Pay is the first thing a job seeker decides on, so the card needs it, not
    // just the detail page. Plenty of scraped listings have no salary at all,
    // hence optional, and the card simply omits the line rather than inventing one.
    payRange: row.salary_range?.trim() || undefined,
    vettedStatus:
      row.vetted_status === 'verified'
        ? VettedStatus.VERIFIED
        : VettedStatus.SKILLS_ASSESSED,
  };
}

// Shared across requests for five minutes. /jobs reads searchParams, so that
// page still renders per request, but the query behind it runs once per five
// minutes instead of once per visit. A Supabase error throws rather than
// returning the static list, because unstable_cache doesn't store a throw, so
// one failed read isn't served to everyone for the next five minutes. The tag
// lets app/api/public-cache drop it the moment an admin or company changes a
// job. Returns null when Supabase isn't configured.
const loadDbJobs = unstable_cache(
  async (): Promise<Job[] | null> => {
    const supabase = createAnonSupabase();
    if (!supabase) return null;

    const today = new Date().toISOString().split('T')[0];

    // select('*') keeps this resilient to columns added by later migrations
    // (e.g. `duration` from add-informal-jobs.sql). Paged with .range()
    // because PostgREST silently caps a single response at 1000 rows and the
    // widened scraper fills the table well past that.
    const PAGE = 1000;
    const rows: DbJob[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, company_profiles ( company_name )`)
        .eq('vetted_status', 'verified')
        .eq('status', 'active')
        .gte('expiry_date', today)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);

      if (error) throw new Error(`${error.message} ${error.details ?? ''}`.trim());
      rows.push(...((data ?? []) as unknown as DbJob[]));
      if (!data || data.length < PAGE) break;
    }

    if (rows.length === 0) {
      console.warn('[publicJobs] No active+verified jobs in DB — falling back to static data')
      return STATIC_JOBS;
    }

    const jobs = rows.filter(isEnglishReadable).map(mapDbJob);

    // South African jobs come first — testers said local jobs were buried at
    // the end of the pages under international remote listings. Within each
    // group the newest-first order from the query is preserved.
    const southAfrican = jobs.filter((j) => isSouthAfricanJob(j.location));
    const international = jobs.filter((j) => !isSouthAfricanJob(j.location));
    return [...southAfrican, ...international];
  },
  ['public-jobs'],
  { revalidate: 300, tags: ['public-jobs'] },
);

export async function fetchPublicJobs(): Promise<Job[]> {
  try {
    return (await loadDbJobs()) ?? STATIC_JOBS;
  } catch (err) {
    console.error('[publicJobs] Supabase error:', err instanceof Error ? err.message : err)
    return STATIC_JOBS;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PublicJobDetail = Job & {
  description?: string;
  requirements?: string | null;
  salaryRange?: string | null;
  source: 'db' | 'static';
};

export async function fetchPublicJob(id: string): Promise<PublicJobDetail | null> {
  const supabase = createAnonSupabase();

  // Static fallback jobs have short ids like '1', which Postgres rejects as a
  // uuid, so only real ids go to the database.
  if (supabase && UUID.test(id)) {
    const today = new Date().toISOString().split('T')[0];

    // The same three conditions the list uses. Without them an unvetted or
    // expired job stayed readable by direct URL, and public insert on `jobs`
    // is open, so anyone could post a job and then share a link to it.
    // A failed read throws instead of returning null: these pages are cached,
    // and null would cache a 404 for a real job. A throw keeps the last good
    // page and retries.
    const { data, error } = await supabase
      .from('jobs')
      .select(`*, company_profiles ( company_name )`)
      .eq('id', id)
      .eq('status', 'active')
      .eq('vetted_status', 'verified')
      .gte('expiry_date', today)
      .maybeSingle();

    if (error) throw new Error(`[publicJobs] Supabase error: ${error.message}`);
    if (data) {
      const row = data as unknown as DbJob;
      const base = mapDbJob(row);
      return {
        ...base,
        description: row.description,
        requirements: row.requirements,
        salaryRange: row.salary_range,
        source: 'db',
      };
    }
  }

  const fallback = STATIC_JOBS.find((j) => j.id === id);
  if (!fallback) return null;
  return { ...fallback, source: 'static' };
}
