#!/usr/bin/env tsx
// Queues a "finish your profile" email for candidates below 70% completeness
// whose profile is at least 48h old. Dedupe key is the ISO week, so a
// candidate who stays incomplete gets nudged at most once a week, not once
// a day, until profile_score (supabase/add-notifications-and-profile-scoring.sql)
// crosses the threshold.
//
// Call with: npx tsx scripts/run-profile-nudges.ts
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getSupabaseAdmin } from '../lib/supabase/admin'
import { missingProfileFields, PROFILE_COMPLETE_THRESHOLD } from '../lib/profileCompleteness'

const MIN_AGE_HOURS = 48

function isoWeekKey(): string {
  const d = new Date()
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

type CandidateRow = {
  user_id: string
  full_name: string | null
  phone: string | null
  location: string | null
  skills: string[] | null
  cv_url: string | null
  portfolio_url: string | null
  professional_summary: string | null
  profile_score: number
  created_at: string
}

async function main() {
  const supabase = getSupabaseAdmin()
  const cutoff = new Date(Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000).toISOString()

  const { data: candidates, error } = await supabase
    .from('candidate_profiles')
    .select('user_id, full_name, phone, location, skills, cv_url, portfolio_url, professional_summary, profile_score, created_at')
    .lt('profile_score', PROFILE_COMPLETE_THRESHOLD)
    .lte('created_at', cutoff)
    .not('user_id', 'is', null)

  if (error) {
    console.error('[profile-nudges] Failed to load incomplete profiles:', error.message)
    process.exit(1)
  }

  const dedupeKey = isoWeekKey()
  let queued = 0
  let skipped = 0

  for (const candidate of (candidates ?? []) as CandidateRow[]) {
    const { data: user } = await supabase.from('users').select('email').eq('id', candidate.user_id).maybeSingle()
    if (!user?.email) {
      skipped++
      continue
    }

    const { error: insertError } = await supabase.from('email_notifications').insert({
      user_id: candidate.user_id,
      recipient_email: user.email,
      type: 'profile_nudge',
      dedupe_key: dedupeKey,
      payload: { missingFields: missingProfileFields(candidate) },
    })

    if (insertError && insertError.code !== '23505') {
      console.error(`[profile-nudges] Failed to queue for ${candidate.user_id}:`, insertError.message)
    } else if (!insertError) {
      queued++
    }
  }

  console.log(`[profile-nudges] queued ${queued}, skipped ${skipped} (no email on file)`)
}

main().catch((err) => {
  console.error('[profile-nudges] Fatal error:', err)
  process.exit(1)
})
