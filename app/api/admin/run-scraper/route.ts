// Protected API route — triggers the scraper manually from the admin panel.
// Protect with a secret header: Authorization: Bearer <SCRAPER_SECRET>
// Set env: SCRAPER_SECRET (any long random string)
//
// The widened SA scrape takes minutes, far beyond a Netlify synchronous
// function's limit, so this route no longer runs the scrape in-process.
// It dispatches the existing GitHub Actions workflow (daily-scraper.yml),
// which has the time budget and the secrets, and returns 202 immediately.
// Set env: GITHUB_DISPATCH_TOKEN (a fine-grained PAT with Actions write on
// the repo) and optionally GITHUB_REPO (defaults to linmucassi/spanispace).

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = process.env.SCRAPER_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'SCRAPER_SECRET not configured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization') ?? ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.GITHUB_DISPATCH_TOKEN
  if (!token) {
    return NextResponse.json(
      {
        error:
          'Manual runs now go through GitHub Actions because the full scrape exceeds the serverless time limit. Trigger the Daily Scraper workflow from the GitHub Actions tab, or set GITHUB_DISPATCH_TOKEN to enable this endpoint.',
      },
      { status: 501 }
    )
  }

  const repo = process.env.GITHUB_REPO ?? 'linmucassi/spanispace'

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/daily-scraper.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ ref: 'main' }),
      }
    )

    if (res.status !== 204) {
      const body = await res.text()
      return NextResponse.json(
        { error: `GitHub dispatch failed (${res.status}): ${body.slice(0, 300)}` },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { ok: true, queued: true, message: 'Scraper workflow dispatched. Watch progress in the GitHub Actions tab.' },
      { status: 202 }
    )
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
