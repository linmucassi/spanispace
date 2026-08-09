#!/usr/bin/env tsx
// Queues a 7-day and a 1-day expiry warning for jobs (including Learnership-
// type listings, which live in the `jobs` table too) expiring exactly that
// far out. Targets whoever owns the listing: the posting company's account
// email, or the poster_email captured on the free-form post-a-job form for
// listings with no company account. Scraped listings usually have neither,
// so they're silently skipped — the daily scraper already keeps their
// expiry dates fresh on its own.
//
// Call with: npx tsx scripts/run-expiry-alerts.ts
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getSupabaseAdmin } from '../lib/supabase/admin'

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

type JobRow = {
  id: string
  title: string
  expiry_date: string
  poster_email: string | null
  company_id: string | null
  company_profiles: { user_id: string | null } | null
}

async function queueAlertsForThreshold(days: 7 | 1) {
  const supabase = getSupabaseAdmin()
  const targetDate = daysFromNow(days)
  const type = days === 7 ? 'expiry_alert_7d' : 'expiry_alert_1d'

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, expiry_date, poster_email, company_id, company_profiles ( user_id )')
    .eq('status', 'active')
    .eq('vetted_status', 'verified')
    .eq('expiry_date', targetDate)

  if (error) {
    console.error(`[expiry-alerts] Failed to load jobs expiring in ${days}d:`, error.message)
    return { queued: 0, skipped: 0 }
  }

  let queued = 0
  let skipped = 0

  for (const job of (jobs ?? []) as unknown as JobRow[]) {
    const ownerUserId = job.company_profiles?.user_id ?? null

    let recipientEmail: string | null = null
    let recipientUserId: string | null = null

    if (ownerUserId) {
      const { data: user } = await supabase.from('users').select('email').eq('id', ownerUserId).maybeSingle()
      recipientEmail = user?.email ?? null
      recipientUserId = ownerUserId
    }
    if (!recipientEmail && job.poster_email) {
      recipientEmail = job.poster_email
    }

    if (!recipientEmail) {
      skipped++
      continue
    }

    const { error: insertError } = await supabase.from('email_notifications').insert({
      user_id: recipientUserId,
      recipient_email: recipientEmail,
      type,
      dedupe_key: `${days}d:${job.id}:${job.expiry_date}`,
      payload: { listingTitle: job.title, expiryDate: job.expiry_date },
    })

    // Unique violation just means this alert already went out for this
    // job+expiry_date combination — not an error, the dedupe index doing its job.
    if (insertError && insertError.code !== '23505') {
      console.error(`[expiry-alerts] Failed to queue for job ${job.id}:`, insertError.message)
    } else if (!insertError) {
      queued++
    }
  }

  return { queued, skipped }
}

async function main() {
  const sevenDay = await queueAlertsForThreshold(7)
  const oneDay = await queueAlertsForThreshold(1)
  console.log(
    `[expiry-alerts] 7-day: queued ${sevenDay.queued}, skipped ${sevenDay.skipped} (no contact email) | ` +
    `1-day: queued ${oneDay.queued}, skipped ${oneDay.skipped}`
  )
}

main().catch((err) => {
  console.error('[expiry-alerts] Fatal error:', err)
  process.exit(1)
})
