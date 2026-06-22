// Adzuna South Africa API — free API key required
// Register at: https://developer.adzuna.com/signup
// SA endpoint: /za/ — real South African job listings
// Set env: ADZUNA_APP_ID and ADZUNA_API_KEY

import type { ScrapedJob, JobType } from '../types'

interface AdzunaJob {
  id: string
  title: string
  description: string
  company: { display_name: string }
  location: { display_name: string }
  redirect_url: string
  contract_type?: string // 'permanent' | 'contract' | 'part_time'
  salary_min?: number
  salary_max?: number
  created: string
}

interface AdzunaResponse {
  results: AdzunaJob[]
  count: number
}

const SEARCH_TERMS = ['developer', 'administrator', 'marketing', 'customer service', 'data analyst', 'sales']

function mapContractType(type?: string): JobType {
  switch (type) {
    case 'contract':
      return 'Contract'
    case 'part_time':
      return 'Part-time'
    default:
      return 'Full-time'
  }
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function buildSalaryRange(min?: number, max?: number): string {
  if (!min && !max) return ''
  const fmt = (n: number) => `R${Math.round(n).toLocaleString('en-ZA')}`
  if (min && max) return `${fmt(min)} – ${fmt(max)}/mo`
  if (min) return `From ${fmt(min)}/mo`
  return ''
}

export async function fetchAdzunaJobs(): Promise<ScrapedJob[]> {
  const appId = process.env.ADZUNA_APP_ID
  const apiKey = process.env.ADZUNA_API_KEY

  if (!appId || !apiKey) {
    console.log('[adzuna] Skipped — ADZUNA_APP_ID / ADZUNA_API_KEY not set')
    return []
  }

  const results: ScrapedJob[] = []
  const seen = new Set<string>()

  for (const term of SEARCH_TERMS) {
    try {
      const url = new URL('https://api.adzuna.com/v1/api/jobs/za/search/1')
      url.searchParams.set('app_id', appId)
      url.searchParams.set('app_key', apiKey)
      url.searchParams.set('results_per_page', '20')
      url.searchParams.set('what', term)
      url.searchParams.set('content-type', 'application/json')

      const res = await fetch(url.toString())
      if (!res.ok) continue

      const data: AdzunaResponse = await res.json()

      for (const j of data.results ?? []) {
        if (!j.redirect_url || seen.has(j.redirect_url)) continue
        seen.add(j.redirect_url)

        results.push({
          title: j.title.trim(),
          description: j.description?.trim().slice(0, 2000) || `${j.title} role in South Africa.`,
          requirements: 'See job listing for full requirements.',
          location: j.location?.display_name || 'South Africa',
          job_type: mapContractType(j.contract_type),
          salary_range: buildSalaryRange(j.salary_min, j.salary_max),
          apply_link: j.redirect_url,
          expiry_date: daysFromNow(30),
          poster_name: j.company?.display_name || 'Employer on Adzuna',
          source: 'adzuna',
        })
      }

      await new Promise((r) => setTimeout(r, 600))
    } catch {
      // Continue with remaining terms
    }
  }

  return results
}
