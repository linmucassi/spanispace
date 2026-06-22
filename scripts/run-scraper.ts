#!/usr/bin/env tsx
// Local test runner — call with: npx tsx scripts/run-scraper.ts
// Or via package.json script: npm run scrape
//
// Required env vars (in .env.local or shell):
//   SUPABASE_URL              — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — from Supabase Dashboard > Settings > API
//
// Optional env vars (skipped if absent):
//   ADZUNA_APP_ID + ADZUNA_API_KEY  — https://developer.adzuna.com/signup
//   EVENTBRITE_API_KEY              — https://www.eventbrite.com/platform/api

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') })

import { runScraper } from '../lib/scrapers/orchestrator'

async function main() {
  try {
    const results = await runScraper()

    console.log('\n=== Scraper Summary ===')
    for (const r of results) {
      const jobLine = r.jobsFound > 0
        ? `jobs: ${r.jobsFound} found, ${r.jobsInserted} new, ${r.jobsRefreshed} refreshed`
        : null
      const evLine = r.eventsFound > 0
        ? `events: ${r.eventsFound} found, ${r.eventsInserted} new`
        : null
      const parts = [jobLine, evLine].filter(Boolean).join(' | ')
      console.log(`  [${r.source}] ${parts || 'skipped'}`)
      if (r.errors.length) r.errors.forEach((e) => console.error(`    ✗ ${e}`))
    }
  } catch (err) {
    console.error('[scraper] Fatal error:', err)
    process.exit(1)
  }
}

main()
