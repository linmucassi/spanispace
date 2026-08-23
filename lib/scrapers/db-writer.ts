// Writes scraped jobs and events to Supabase.
// Uses the SERVICE ROLE KEY (bypasses RLS) — never expose this on the client.
// Deduplication: checks apply_link before inserting; refreshes expiry if already present.
// Cleanup: deletes records that expired more than 90 days ago.

import { getSupabaseAdmin } from '../supabase/admin'
import { isMojibake } from '../textQuality'
import type { ScrapedJob, ScrapedEvent } from './types'

// Reject jobs whose title or poster_name contain non-Latin characters
// (CJK, Arabic, Cyrillic, etc. from global job boards are not relevant for SA audiences),
// or mojibake of one of those scripts -- a source not honouring its own
// charset can produce text that's garbled but still lands entirely within
// the Latin range this first check allows through. See lib/textQuality.ts.
function isLatinJob(job: ScrapedJob): boolean {
  const nonLatin = /[^ -ɏ\s]/u;
  if (nonLatin.test(job.title) || nonLatin.test(job.poster_name ?? '')) return false;
  if (isMojibake(job.title) || isMojibake(job.poster_name)) return false;
  return true;
}

// If supabase/add-informal-jobs.sql has not been run yet, the jobs table
// rejects the new job_type values and has no duration column. Downgrade and
// retry instead of losing the job.
const JOB_TYPE_FALLBACK: Record<string, string> = {
  'Piece Job': 'Part-time',
  'Temporary': 'Contract',
}

// Chunk sizes: selects and updates travel in the URL querystring, so they
// stay small; inserts go in the POST body and can be larger.
const SELECT_CHUNK = 50
const UPDATE_CHUNK = 100
const INSERT_CHUNK = 200

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

function isSchemaError(code: string | undefined, msg: string, column: string): boolean {
  return code === 'PGRST204' || code === '42703' || msg.includes(column)
}

async function updateJobWithFallback(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  id: string,
  row: Record<string, unknown>
): Promise<string | null> {
  let attempt = { ...row }
  for (let i = 0; i < 3; i++) {
    const { error } = await supabase.from('jobs').update(attempt).eq('id', id)
    if (!error) return null

    const msg = error.message ?? ''
    const fallbackType = JOB_TYPE_FALLBACK[String(attempt.job_type)]
    if (msg.includes('job_type') && fallbackType) {
      attempt = { ...attempt, job_type: fallbackType }
      continue
    }
    if ('duration' in attempt && isSchemaError(error.code, msg, 'duration')) {
      const rest = { ...attempt }
      delete rest.duration
      attempt = rest
      continue
    }
    return msg
  }
  return 'update retries exhausted'
}

export async function writeJobs(jobs: ScrapedJob[]): Promise<{ inserted: number; refreshed: number; errors: string[] }> {
  const supabase = getSupabaseAdmin()
  const errors: string[] = []
  let inserted = 0
  let refreshed = 0

  const cleanJobs = jobs.filter(isLatinJob)
  const nowIso = new Date().toISOString()

  // 1) Bulk dedupe: find which apply_links already exist. Also fetch the
  //    stored job_type (and duration, once the column exists) so rows that
  //    were downgraded before the migration ran can be healed on refresh.
  type ExistingRow = { id: string; apply_link: string; job_type: string; duration?: string | null }
  const existingByLink = new Map<string, ExistingRow>()
  let durationColumnKnown = true

  for (const links of chunk(cleanJobs.map((j) => j.apply_link), SELECT_CHUNK)) {
    let res = await supabase
      .from('jobs')
      .select('id, apply_link, job_type, duration')
      .in('apply_link', links)
    if (res.error && isSchemaError(res.error.code, res.error.message ?? '', 'duration')) {
      durationColumnKnown = false
      res = (await supabase
        .from('jobs')
        .select('id, apply_link, job_type')
        .in('apply_link', links)) as typeof res
    }
    if (res.error) {
      errors.push(`[jobs] dedupe select failed: ${res.error.message}`)
      continue
    }
    for (const row of (res.data ?? []) as unknown as ExistingRow[]) existingByLink.set(row.apply_link, row)
  }

  const newJobs = cleanJobs.filter((j) => !existingByLink.has(j.apply_link))
  const existingJobs = cleanJobs.filter((j) => existingByLink.has(j.apply_link))

  // 2) Refresh existing rows. Rows whose stored job_type disagrees with the
  //    scrape (e.g. downgraded pre-migration) or that are missing a known
  //    duration get individually healed; the rest get a bulk expiry bump.
  const toHeal: ScrapedJob[] = []
  const toBump: string[] = []
  for (const job of existingJobs) {
    const stored = existingByLink.get(job.apply_link)!
    const needsHeal =
      stored.job_type !== job.job_type ||
      (durationColumnKnown && !!job.duration && !stored.duration)
    if (needsHeal) toHeal.push(job)
    else toBump.push(stored.id)
  }

  for (const ids of chunk(toBump, UPDATE_CHUNK)) {
    const { error } = await supabase
      .from('jobs')
      .update({ expiry_date: daysAhead(30), updated_at: nowIso })
      .in('id', ids)
    if (error) errors.push(`[jobs] bulk refresh failed: ${error.message}`)
    else refreshed += ids.length
  }

  for (const job of toHeal) {
    const stored = existingByLink.get(job.apply_link)!
    const healError = await updateJobWithFallback(supabase, stored.id, {
      expiry_date: job.expiry_date,
      updated_at: nowIso,
      job_type: job.job_type,
      ...(job.duration ? { duration: job.duration } : {}),
    })
    if (healError) errors.push(`[jobs] ${job.title}: refresh failed: ${healError}`)
    else refreshed++
  }

  // 3) Bulk insert new rows. All rows in a chunk carry the same keys, so the
  //    schema fallbacks apply chunk-wide: drop duration if the column is
  //    missing, downgrade new job_type values if the CHECK is old, drop
  //    origin/apply_mode if supabase/add-application-journeys.sql hasn't run
  //    yet on this database. company_id stays NULL and vetted_status stays
  //    'pending' regardless -- scraped jobs are never auto-owned by a shared
  //    company account and always go through the normal admin review queue,
  //    see supabase/add-application-journeys.sql for why.
  const buildRow = (job: ScrapedJob, opts: { withDuration: boolean; withOrigin: boolean; downgrade: boolean }) => ({
    company_id: null,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    location: job.location,
    job_type: opts.downgrade ? (JOB_TYPE_FALLBACK[job.job_type] ?? job.job_type) : job.job_type,
    ...(opts.withDuration ? { duration: job.duration ?? null } : {}),
    salary_range: job.salary_range || null,
    apply_link: job.apply_link,
    expiry_date: job.expiry_date,
    vetted_status: 'pending',
    poster_name: job.poster_name,
    status: 'active',
    ...(opts.withOrigin ? { origin: 'scraped', apply_mode: 'redirect' } : {}),
  })

  for (const group of chunk(newJobs, INSERT_CHUNK)) {
    let withDuration = durationColumnKnown
    let withOrigin = true
    let downgrade = false
    let lastMessage = ''
    let ok = false

    for (let i = 0; i < 4 && !ok; i++) {
      const { error } = await supabase
        .from('jobs')
        .insert(group.map((j) => buildRow(j, { withDuration, withOrigin, downgrade })))
      if (!error) {
        ok = true
        break
      }
      lastMessage = error.message ?? ''
      if (withDuration && isSchemaError(error.code, lastMessage, 'duration')) {
        withDuration = false
        durationColumnKnown = false
        continue
      }
      if (withOrigin && (isSchemaError(error.code, lastMessage, 'origin') || isSchemaError(error.code, lastMessage, 'apply_mode'))) {
        withOrigin = false
        continue
      }
      if (!downgrade && lastMessage.includes('job_type')) {
        downgrade = true
        continue
      }
      break
    }

    if (ok) inserted += group.length
    else errors.push(`[jobs] bulk insert of ${group.length} rows failed: ${lastMessage}`)
  }

  return { inserted, refreshed, errors }
}

function daysAhead(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
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
