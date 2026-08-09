#!/usr/bin/env tsx
// Queues a weekly "new jobs matching your skills" digest. Matching is a
// plain case-insensitive substring check of each candidate skill against the
// job's title/description/requirements — there's no embeddings-based
// matching in this codebase yet (that's Phase 4 in docs/ROADMAP.md). This is
// deliberately simple: good enough to be useful, not a promise of precision.
//
// Call with: npx tsx scripts/run-weekly-digest.ts
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getSupabaseAdmin } from '../lib/supabase/admin'

const MAX_MATCHES_PER_CANDIDATE = 5

function isoWeekKey(): string {
  const d = new Date()
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

type JobRow = {
  id: string
  title: string
  description: string | null
  requirements: string | null
  location: string
  poster_name: string | null
  company_profiles: { company_name: string } | null
}

type CandidateRow = {
  user_id: string
  skills: string[] | null
}

function jobText(job: JobRow): string {
  return `${job.title} ${job.description ?? ''} ${job.requirements ?? ''}`.toLowerCase()
}

function matchesSkills(job: JobRow, skills: string[]): boolean {
  const text = jobText(job)
  return skills.some((skill) => skill.trim().length > 1 && text.includes(skill.trim().toLowerCase()))
}

async function main() {
  const supabase = getSupabaseAdmin()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, description, requirements, location, poster_name, company_profiles ( company_name )')
    .eq('status', 'active')
    .eq('vetted_status', 'verified')
    .gte('created_at', sevenDaysAgo)

  if (jobsError) {
    console.error('[weekly-digest] Failed to load recent jobs:', jobsError.message)
    process.exit(1)
  }

  const recentJobs = (jobs ?? []) as unknown as JobRow[]
  if (recentJobs.length === 0) {
    console.log('[weekly-digest] No new jobs this week — nothing to send.')
    return
  }

  // Filtering on an empty text[] via PostgREST is fragile, so the "has any
  // skills" check happens below in JS instead of in this query.
  const { data: candidates, error: candidatesError } = await supabase
    .from('candidate_profiles')
    .select('user_id, skills')
    .not('user_id', 'is', null)

  if (candidatesError) {
    console.error('[weekly-digest] Failed to load candidates:', candidatesError.message)
    process.exit(1)
  }

  const dedupeKey = isoWeekKey()
  let queued = 0

  for (const candidate of (candidates ?? []) as CandidateRow[]) {
    const skills = candidate.skills ?? []
    if (skills.length === 0) continue

    const matches = recentJobs
      .filter((job) => matchesSkills(job, skills))
      .slice(0, MAX_MATCHES_PER_CANDIDATE)
      .map((job) => ({
        title: job.title,
        company: job.company_profiles?.company_name ?? job.poster_name ?? 'Spanispace Partner',
        location: job.location,
      }))

    if (matches.length === 0) continue

    const { data: user } = await supabase.from('users').select('email').eq('id', candidate.user_id).maybeSingle()
    if (!user?.email) continue

    const { error: insertError } = await supabase.from('email_notifications').insert({
      user_id: candidate.user_id,
      recipient_email: user.email,
      type: 'weekly_digest',
      dedupe_key: dedupeKey,
      payload: { matches },
    })

    if (insertError && insertError.code !== '23505') {
      console.error(`[weekly-digest] Failed to queue for ${candidate.user_id}:`, insertError.message)
    } else if (!insertError) {
      queued++
    }
  }

  console.log(`[weekly-digest] ${recentJobs.length} new jobs this week, queued ${queued} digests`)
}

main().catch((err) => {
  console.error('[weekly-digest] Fatal error:', err)
  process.exit(1)
})
