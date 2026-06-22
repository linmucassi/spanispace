// Main scraper orchestrator — runs all sources in parallel, writes to DB, cleans up.
// Called by scripts/run-scraper.ts (local) and the GitHub Actions workflow (production).

import { fetchRemoteOKJobs } from './sources/remoteok'
import { fetchRemotiveJobs } from './sources/remotive'
import { fetchAdzunaJobs } from './sources/adzuna'
import { fetchEventbriteEvents } from './sources/eventbrite'
import { writeJobs, writeEvents, cleanupExpired } from './db-writer'
import type { ScraperRunResult } from './types'

export async function runScraper(): Promise<ScraperRunResult[]> {
  console.log(`[scraper] Starting run at ${new Date().toISOString()}`)

  // Fetch from all sources concurrently
  const [remoteokJobs, remotiveJobs, adzunaJobs, eventbriteEvents] = await Promise.allSettled([
    fetchRemoteOKJobs(),
    fetchRemotiveJobs(),
    fetchAdzunaJobs(),
    fetchEventbriteEvents(),
  ])

  const results: ScraperRunResult[] = []

  // --- Jobs ---
  const jobSources = [
    { name: 'remoteok', result: remoteokJobs },
    { name: 'remotive', result: remotiveJobs },
    { name: 'adzuna', result: adzunaJobs },
  ] as const

  for (const { name, result } of jobSources) {
    if (result.status === 'rejected') {
      results.push({
        source: name,
        jobsFound: 0, jobsInserted: 0, jobsRefreshed: 0,
        eventsFound: 0, eventsInserted: 0,
        errors: [`Fetch failed: ${String(result.reason)}`],
      })
      continue
    }

    const jobs = result.value
    console.log(`[${name}] Fetched ${jobs.length} jobs`)

    const { inserted, refreshed, errors } = await writeJobs(jobs)
    console.log(`[${name}] Inserted ${inserted}, refreshed ${refreshed}, errors ${errors.length}`)

    results.push({
      source: name,
      jobsFound: jobs.length, jobsInserted: inserted, jobsRefreshed: refreshed,
      eventsFound: 0, eventsInserted: 0,
      errors,
    })
  }

  // --- Events ---
  if (eventbriteEvents.status === 'rejected') {
    results.push({
      source: 'eventbrite',
      jobsFound: 0, jobsInserted: 0, jobsRefreshed: 0,
      eventsFound: 0, eventsInserted: 0,
      errors: [`Fetch failed: ${String(eventbriteEvents.reason)}`],
    })
  } else {
    const events = eventbriteEvents.value
    console.log(`[eventbrite] Fetched ${events.length} events`)

    const { inserted, errors } = await writeEvents(events)
    console.log(`[eventbrite] Inserted ${inserted}, errors ${errors.length}`)

    results.push({
      source: 'eventbrite',
      jobsFound: 0, jobsInserted: 0, jobsRefreshed: 0,
      eventsFound: events.length, eventsInserted: inserted,
      errors,
    })
  }

  // --- Cleanup expired records ---
  const { jobsDeleted, eventsDeleted } = await cleanupExpired()
  console.log(`[cleanup] Deleted ${jobsDeleted} expired jobs, ${eventsDeleted} completed events`)

  const totalJobs = results.reduce((s, r) => s + r.jobsInserted, 0)
  const totalRefreshed = results.reduce((s, r) => s + r.jobsRefreshed, 0)
  const totalEvents = results.reduce((s, r) => s + r.eventsInserted, 0)
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0)

  console.log(
    `[scraper] Done — ${totalJobs} new jobs, ${totalRefreshed} refreshed, ` +
    `${totalEvents} new events, ${jobsDeleted} deleted, ${totalErrors} errors`
  )

  return results
}
