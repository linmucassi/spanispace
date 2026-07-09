#!/usr/bin/env tsx
// Local test runner — call with: npx tsx scripts/run-auto-apply-matcher.ts
// Or via package.json script: npm run auto-apply-match
//
// Required env vars (in .env.local or shell):
//   SUPABASE_URL              — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — from Supabase Dashboard > Settings > API
//
// Run this after the daily scraper so newly-ingested jobs get matched the
// same day.

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { runAutoApplyMatcher } from '../lib/autoApply/matcher'

async function main() {
  try {
    const result = await runAutoApplyMatcher()

    console.log('\n=== Auto-Apply Matcher Summary ===')
    console.log(`  Candidates processed: ${result.candidatesProcessed}`)
    console.log(`  New matches created: ${result.matchesCreated}`)
    if (result.errors.length) result.errors.forEach((e) => console.error(`  ✗ ${e}`))
  } catch (err) {
    console.error('[auto-apply-matcher] Fatal error:', err)
    process.exit(1)
  }
}

main()
