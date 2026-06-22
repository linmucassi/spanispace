// Protected API route — triggers the scraper manually from the admin panel.
// Protect with a secret header: Authorization: Bearer <SCRAPER_SECRET>
// Set env: SCRAPER_SECRET (any long random string)

import { NextRequest, NextResponse } from 'next/server'
import { runScraper } from '@/lib/scrapers/orchestrator'

export async function POST(req: NextRequest) {
  const secret = process.env.SCRAPER_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'SCRAPER_SECRET not configured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await runScraper()
    const totalInserted = results.reduce((s, r) => s + r.jobsInserted + r.eventsInserted, 0)
    const totalRefreshed = results.reduce((s, r) => s + r.jobsRefreshed, 0)
    const allErrors = results.flatMap((r) => r.errors)

    return NextResponse.json({
      ok: true,
      totalInserted,
      totalRefreshed,
      errors: allErrors,
      sources: results,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
