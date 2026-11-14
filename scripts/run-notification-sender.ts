#!/usr/bin/env tsx
// Drains the email_notifications outbox (supabase/add-notifications-and-profile-scoring.sql)
// and sends each pending row via Resend. Call with: npx tsx scripts/run-notification-sender.ts
//
// Rows are written two ways: instantly by DB triggers (application status
// change, new message, event registration) and periodically by
// scripts/run-expiry-alerts.ts, run-profile-nudges.ts, run-weekly-digest.ts.
// This script doesn't care which — it just sends whatever is pending.
//
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { getSupabaseAdmin } from '../lib/supabase/admin'
import {
  sendEmail,
  isEmailConfigured,
  applicationStatusEmail,
  newMessageEmail,
  eventRegistrationEmail,
  expiryAlertEmail,
  weeklyDigestEmail,
  profileNudgeEmail,
} from '../lib/email'

const BATCH_SIZE = 200
// Pending rows older than this are never sent. Every producer either fires on
// a real event (message, status change) or reruns daily/weekly, so a row this
// old is either stale news or will be produced again fresh.
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000

type NotificationRow = {
  id: string
  recipient_email: string
  type: string
  payload: Record<string, unknown>
}

function renderEmail(row: NotificationRow): { subject: string; html: string; text: string } | null {
  const p = row.payload as never
  switch (row.type) {
    case 'application_status':
      return applicationStatusEmail(p)
    case 'new_message':
      return newMessageEmail(p)
    case 'event_registration':
      return eventRegistrationEmail(p)
    case 'expiry_alert_7d':
      return expiryAlertEmail({ ...(p as { listingTitle: string; expiryDate: string }), daysLeft: 7 })
    case 'expiry_alert_1d':
      return expiryAlertEmail({ ...(p as { listingTitle: string; expiryDate: string }), daysLeft: 1 })
    case 'weekly_digest':
      return weeklyDigestEmail(p)
    case 'profile_nudge':
      return profileNudgeEmail(p)
    default:
      return null
  }
}

async function main() {
  if (!isEmailConfigured()) {
    console.log('[notification-sender] RESEND_API_KEY/EMAIL_FROM not set — nothing to do.')
    return
  }

  const supabase = getSupabaseAdmin()

  // Retire anything too old to be useful before sending. Without this, the
  // first run after Resend is configured would mail out the whole backlog,
  // months-old "you have a new message" emails included (319 rows were
  // waiting on 14 Nov 2026). The table only allows pending/sent/failed, so
  // stale rows become failed with a reason that says why.
  const cutoff = new Date(Date.now() - MAX_AGE_MS).toISOString()
  const { count: expired, error: expireError } = await supabase
    .from('email_notifications')
    .update({ status: 'failed', error: 'expired: not sent within 3 days' }, { count: 'exact' })
    .eq('status', 'pending')
    .lt('created_at', cutoff)
  if (expireError) {
    console.error('[notification-sender] Failed to expire stale notifications:', expireError.message)
    process.exit(1)
  }
  if (expired) console.log(`[notification-sender] expired ${expired} stale`)

  const { data: rows, error } = await supabase
    .from('email_notifications')
    .select('id, recipient_email, type, payload')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) {
    console.error('[notification-sender] Failed to load pending notifications:', error.message)
    process.exit(1)
  }

  const pending = (rows ?? []) as NotificationRow[]
  console.log(`[notification-sender] ${pending.length} pending`)

  let sent = 0
  let failed = 0

  for (const row of pending) {
    const rendered = renderEmail(row)
    if (!rendered) {
      await supabase
        .from('email_notifications')
        .update({ status: 'failed', error: `Unknown type: ${row.type}` })
        .eq('id', row.id)
      failed++
      continue
    }

    const result = await sendEmail({ to: row.recipient_email, ...rendered })
    if (result.sent) {
      await supabase
        .from('email_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } else {
      await supabase
        .from('email_notifications')
        .update({ status: 'failed', error: result.reason ?? 'unknown' })
        .eq('id', row.id)
      failed++
    }
  }

  console.log(`[notification-sender] sent: ${sent}, failed: ${failed}`)
  if (failed > 0 && sent === 0 && pending.length > 0) {
    // Every single send failed — likely a Resend outage or bad key, not
    // individually bad rows. Fail the run so CI goes red.
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[notification-sender] Fatal error:', err)
  process.exit(1)
})
