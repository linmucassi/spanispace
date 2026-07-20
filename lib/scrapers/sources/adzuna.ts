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
// If this many queries fail before any succeeds, the key or account is the
// problem — fail the whole source loudly instead of returning a quiet zero.
const EARLY_FAILURE_THRESHOLD = 3

function detectJobType(title: string, description: string, contractTime?: string, contractType?: string): JobType {
  const text = `${title} ${description}`.toLowerCase()
  // Unambiguous informal-work phrases beat everything (Adzuna ZA metadata is often defaulted)
  if (/\b(piece\s*jobs?|weekends?\s+only)\b/.test(text)) return 'Piece Job'
  // Trust explicit structured metadata next: a job marked permanent is never Piece Job or Temporary
  if (contractType === 'permanent') return contractTime === 'part_time' ? 'Part-time' : 'Full-time'
  // 'casual'/'seasonal' only count next to a work noun, so 'casual dining',
  // 'smart casual' and 'seasonal ingredients' never match
  if (/\bcasual\s+(work|worker|position|role|job|labour|labor|staff|shifts?)\b/.test(text)) return 'Piece Job'
  if (/\b(temporary|fixed[-\s]?term|temp\s+(position|role|staff|worker)|seasonal\s+(work|worker|position|role|job|staff|contract))\b/.test(text)) return 'Temporary'
  if (contractTime === 'part_time' || /\bpart[-\s]?time\b/.test(title.toLowerCase())) return 'Part-time'
  if (contractType === 'contract') return 'Contract'
  return 'Full-time'
}

// Pull an explicit duration ("3 months", "6 week") out of the title, or a
// clearly contract-shaped mention in the description. Deliberately narrow so
// "6 months' experience" or "nanny for a 6 month old" never become durations.
function detectDuration(title: string, description: string): string | undefined {
  const fromTitle = title.match(/\b(\d{1,2})\s*[-\s]?(month|week)s?\b(?!['’]?\s*(?:of\s+)?(?:experience|exp\b)|\s*-?\s*old\b)/i)
  if (fromTitle) return `${fromTitle[1]} ${fromTitle[2]}${Number(fromTitle[1]) > 1 ? 's' : ''}`
  const fromDesc = description.match(/\b(\d{1,2})\s*[-\s]?(month|week)s?\s*(fixed[-\s]?term|contract|assignment|position)\b/i)
  if (fromDesc) return `${fromDesc[1]} ${fromDesc[2]}${Number(fromDesc[1]) > 1 ? 's' : ''}`
  if (/\bseasonal\s+(work|worker|position|role|job|staff|contract)\b/i.test(title)) return 'Seasonal'
  return undefined
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Adzuna normalises ZA salaries to ANNUAL figures, but South African job
// seekers think in monthly pay — always convert, never guess from magnitude.
function buildSalaryRange(min?: number, max?: number): string {
  if (!min && !max) return ''
  const fmt = (n: number) => `R${Math.round(n / 12).toLocaleString('en-ZA')}`
  if (min && max) return `${fmt(min)} – ${fmt(max)}/mo`
  if (min) return `From ${fmt(min)}/mo`
  return ''
}

// Adzuna redirect_urls carry per-request tracking tokens; strip the volatile
// one so the stored apply_link stays stable for cross-run deduplication.
function stableApplyLink(u: string): string {
  try {
    const url = new URL(u)
    url.searchParams.delete('se')
    return url.toString()
  } catch {
    return u
  }
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
  if (!res.ok) {
    throw new Error(`adzuna ${res.status} ${res.statusText} for ${JSON.stringify(params)} page ${page}`)
  }

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
  let failedQueries = 0
  let succeededQueries = 0
  let lastError: unknown = null

  const queries: Record<string, string>[] = [
    ...SEARCH_TERMS.map((term) => ({ what: term })),
    ...CATEGORIES.map((category) => ({ category })),
  ]

  for (const query of queries) {
    for (let page = 1; page <= PAGES_PER_QUERY; page++) {
      try {
        const jobs = await fetchPage(query, page, appId, apiKey)
        succeededQueries++

        for (const j of jobs) {
          const dedupeKey = j.id || j.redirect_url
          if (!j.redirect_url || !dedupeKey || seen.has(dedupeKey)) continue
          seen.add(dedupeKey)

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
            apply_link: stableApplyLink(j.redirect_url),
            expiry_date: daysFromNow(30),
            poster_name: j.company?.display_name || 'Employer on Adzuna',
            source: 'adzuna',
          })
        }

        // A short page means there is no next page worth fetching —
        // and no reason to sleep before moving on either
        if (jobs.length < RESULTS_PER_PAGE) break
        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS))
      } catch (err) {
        failedQueries++
        lastError = err
        console.error(`[adzuna] Query failed: ${String(err)}`)
        // An auth failure, or nothing but failures early on, means the key or
        // account is broken — surface it instead of returning a quiet zero
        const message = String(err)
        const authShaped = message.includes(' 401 ') || message.includes(' 403 ')
        if (authShaped || (succeededQueries === 0 && failedQueries >= EARLY_FAILURE_THRESHOLD)) {
          throw err
        }
        break // move on to the next query
      }
    }
  }

  if (results.length === 0 && lastError) {
    throw lastError
  }

  console.log(`[adzuna] Collected ${results.length} unique South African jobs (${failedQueries} failed queries)`)
  return results
}
