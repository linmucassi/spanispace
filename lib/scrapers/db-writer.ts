// Writes scraped jobs and events to Supabase.
// Uses the SERVICE ROLE KEY (bypasses RLS) — never expose this on the client.
// Deduplication: checks apply_link before inserting; refreshes expiry if already present.
// Cleanup: deletes records that expired more than 90 days ago.

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { ScrapedJob, ScrapedEvent } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any>

let _admin: AdminClient | null = null

function getSupabaseAdmin(): AdminClient {
  if (_admin) return _admin

  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
    .replace(/\/rest\/v1\/?$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add them to your environment. Get the service role key from ' +
      'Supabase Dashboard > Settings > API.'
    )
  }

  _admin = createClient(url, key, { auth: { persistSession: false } })
  return _admin
}

async function getCuratedCompanyId(): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('company_name', 'Spanispace Curated')
    .limit(1)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

// Reject jobs whose title or poster_name contain non-Latin characters
// (CJK, Arabic, Cyrillic, etc. from global job boards are not relevant for SA audiences)
function isLatinJob(job: ScrapedJob): boolean {
  const nonLatin = /[^ -ɏ\s]/u;
  return !nonLatin.test(job.title) && !nonLatin.test(job.poster_name ?? '');
}

export async function writeJobs(jobs: ScrapedJob[]): Promise<{ inserted: number; refreshed: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()
  const companyId = await getCuratedCompanyId()
  const errors: string[] = []
  let inserted = 0
  let refreshed = 0

  for (const job of jobs.filter(isLatinJob)) {
    try {
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('apply_link', job.apply_link)
        .limit(1)
        .maybeSingle()

      const existingId = (existing as { id: string } | null)?.id

      if (existingId) {
        await supabase
          .from('jobs')
          .update({ expiry_date: job.expiry_date, updated_at: new Date().toISOString() })
          .eq('id', existingId)
        refreshed++
      } else {
        const { error } = await supabase.from('jobs').insert({
          company_id: companyId ?? null,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          job_type: job.job_type,
          salary_range: job.salary_range || null,
          apply_link: job.apply_link,
          expiry_date: job.expiry_date,
          vetted_status: 'verified',
          poster_name: job.poster_name,
          status: 'active',
        })
        if (error) {
          errors.push(`[jobs] ${job.title}: ${error.message}`)
        } else {
          inserted++
        }
      }
    } catch (err) {
      errors.push(`[jobs] ${job.title}: ${String(err)}`)
    }
  }

  return { inserted, refreshed, errors }
}

export async function writeEvents(events: ScrapedEvent[]): Promise<{ inserted: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let inserted = 0

  for (const ev of events) {
    try {
      const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('title', ev.title)
        .gte('start_date', new Date().toISOString())
        .limit(1)
        .maybeSingle()

      if ((existing as { id: string } | null)?.id) continue

      const { error } = await supabase.from('events').insert({
        creator_id: null,
        title: ev.title,
        description: ev.description,
        event_type: ev.event_type,
        format: ev.format,
        location: ev.location,
        start_date: ev.start_date,
        end_date: ev.end_date,
        registration_deadline: ev.registration_deadline,
        is_public: ev.is_public,
        status: 'published',
      })
      if (error) {
        errors.push(`[events] ${ev.title}: ${error.message}`)
      } else {
        inserted++
      }
    } catch (err) {
      errors.push(`[events] ${ev.title}: ${String(err)}`)
    }
  }

  return { inserted, errors }
}

// Remove jobs and events that expired more than 90 days ago (DB housekeeping)
export async function cleanupExpired(): Promise<{ jobsDeleted: number; eventsDeleted: number }> {
  const supabase = getSupabaseAdmin()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffDate = cutoff.toISOString().split('T')[0]

  const { count: jobsDeleted } = await supabase
    .from('jobs')
    .delete({ count: 'exact' })
    .lt('expiry_date', cutoffDate)
    .eq('status', 'active')

  const { count: eventsDeleted } = await supabase
    .from('events')
    .delete({ count: 'exact' })
    .lt('start_date', cutoff.toISOString())
    .eq('status', 'completed')

  return { jobsDeleted: jobsDeleted ?? 0, eventsDeleted: eventsDeleted ?? 0 }
}
