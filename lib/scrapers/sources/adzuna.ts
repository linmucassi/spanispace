// Adzuna South Africa API — free API key required
// Register at: https://developer.adzuna.com/signup
// SA endpoint: /za/ — real South African job listings
// Set env: ADZUNA_APP_ID and ADZUNA_API_KEY
//
// This is the ONLY source that returns real, on-the-ground South African jobs,
// so it deliberately casts a wide net: everyday search terms (waiter, cashier,
// cleaner, security guard...) plus whole Adzuna categories that cover informal
// and entry-level work. Tester feedback (July 2026): the board was dominated by
// international remote tech roles ordinary South Africans could not relate to.

import type { ScrapedJob, JobType } from '../types'

interface AdzunaJob {
  id: string
  title: string
  description: string
  company: { display_name: string }
  location: { display_name: string }
  redirect_url: string
  contract_type?: string // 'permanent' | 'contract'
  contract_time?: string // 'full_time' | 'part_time'
  salary_min?: number
  salary_max?: number
  created: string
}

interface AdzunaResponse {
  results: AdzunaJob[]
  count: number
}

// Everyday work first — these are the jobs testers said were missing.
const SEARCH_TERMS = [
  'waiter',
  'cashier',
  'cleaner',
  'general worker',
  'security guard',
  'driver',
  'retail assistant',
  'call centre',
  'receptionist',
  'kitchen assistant',
  // Original white-collar terms
  'developer',
  'administrator',
  'marketing',
  'customer service',
  'data analyst',
  'sales',
]

// Adzuna category browse — pulls full categories of entry-level and informal
// work without depending on a keyword being in the title.
const CATEGORIES = [
  'hospitality-catering-jobs',
  'retail-jobs',
  'customer-services-jobs',
  'logistics-warehouse-jobs',
  'trade-construction-jobs',
  'domestic-help-cleaning-jobs',
  'maintenance-jobs',
  'part-time-jobs',
  'other-general-jobs',
  'graduate-jobs',
]

const RESULTS_PER_PAGE = 50
const PAGES_PER_QUERY = 2
// Adzuna's free tier throttles aggressively — stay well under 25 requests/min.
const REQUEST_DELAY_MS = 2500

function detectJobType(title: string, description: string, contractTime?: string, contractType?: string): JobType {
  const text = `${title} ${description}`.toLowerCase()
  if (/\b(piece\s*job|casual\b|weekends?\s+only)/.test(text)) return 'Piece Job'
  if (/\b(temporary|seasonal|fixed[-\s]?term|temp\s+(position|role|staff|worker))/.test(text)) return 'Temporary'
  if (contractTime === 'part_time' || /\bpart[-\s]?time\b/.test(title.toLowerCase())) return 'Part-time'
  if (contractType === 'contract') return 'Contract'
  return 'Full-time'
}

// Pull an explicit duration ("3 months", "6 week") out of the title, or a
// clearly contract-shaped mention in the description. Deliberately narrow so
// "3 years' experience required" never becomes a duration.
function detectDuration(title: string, description: string): string | undefined {
  const fromTitle = title.match(/\b(\d{1,2})\s*[-\s]?(month|week)s?\b(?!\s*(experience|exp\b))/i)
  if (fromTitle) return `${fromTitle[1]} ${fromTitle[2]}${Number(fromTitle[1]) > 1 ? 's' : ''}`
  const fromDesc = description.match(/\b(\d{1,2})\s*[-\s]?(month|week)s?\s*(fixed[-\s]?term|contract|assignment|position)\b/i)
  if (fromDesc) return `${fromDesc[1]} ${fromDesc[2]}${Number(fromDesc[1]) > 1 ? 's' : ''}`
  if (/\bseasonal\b/i.test(title)) return 'Seasonal'
  return undefined
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Adzuna ZA returns annualised salary estimates, but South African job seekers
// think in monthly pay. Values >= 30000 are treated as annual and shown per
// month; smaller values are assumed to already be monthly figures.
function buildSalaryRange(min?: number, max?: number): string {
  if (!min && !max) return ''
  const isAnnual = Math.max(min ?? 0, max ?? 0) >= 30000
  const toMonthly = (n: number) => (isAnnual ? n / 12 : n)
  const fmt = (n: number) => `R${Math.round(toMonthly(n)).toLocaleString('en-ZA')}`
  if (min && max) return `${fmt(min)} – ${fmt(max)}/mo`
  if (min) return `From ${fmt(min)}/mo`
  return ''
}

async function fetchPage(params: Record<string, string>, page: number, appId: string, apiKey: string): Promise<AdzunaJob[]> {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/za/search/${page}`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', apiKey)
  url.searchParams.set('results_per_page', String(RESULTS_PER_PAGE))
  url.searchParams.set('content-type', 'application/json')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  let res = await fetch(url.toString())
  if (res.status === 429) {
    // Throttled — back off once, then give up on this page
    await new Promise((r) => setTimeout(r, 10_000))
    res = await fetch(url.toString())
  }
  if (!res.ok) return []

  const data: AdzunaResponse = await res.json()
  return data.results ?? []
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

  const queries: Record<string, string>[] = [
    ...SEARCH_TERMS.map((term) => ({ what: term })),
    ...CATEGORIES.map((category) => ({ category })),
  ]

  for (const query of queries) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      try {
        const jobs = await fetchPage(query, page, appId, apiKey)

        for (const j of jobs) {
          if (!j.redirect_url || seen.has(j.redirect_url)) continue
          seen.add(j.redirect_url)

          const title = j.title?.trim() ?? ''
          const description = j.description?.trim() ?? ''
          if (!title) continue

          results.push({
            title,
            description: description.slice(0, 2000) || `${title} role in South Africa.`,
            requirements: 'See job listing for full requirements.',
            location: j.location?.display_name || 'South Africa',
            job_type: detectJobType(title, description, j.contract_time, j.contract_type),
            duration: detectDuration(title, description),
            salary_range: buildSalaryRange(j.salary_min, j.salary_max),
            apply_link: j.redirect_url,
            expiry_date: daysFromNow(30),
            poster_name: j.company?.display_name || 'Employer on Adzuna',
            source: 'adzuna',
          })
        }

        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS))
        // A short page means there is no next page worth fetching
        if (jobs.length < RESULTS_PER_PAGE) break
      } catch {
        break // move on to the next query
      }
    }
  }

  console.log(`[adzuna] Collected ${results.length} unique South African jobs`)
  return results
}
