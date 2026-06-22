// Remotive public JSON API — no API key required
// Docs: https://remotive.com/api/remote-jobs
// Covers: software dev, customer support, design, marketing, writing, data, devops

import type { ScrapedJob, JobType } from '../types'

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  category: string
  tags: string[]
  job_type: string // 'full_time' | 'part_time' | 'contract' | 'freelance'
  publication_date: string
  candidate_required_location: string
  salary: string
  description: string
}

interface RemotiveResponse {
  'item-count': number
  jobs: RemotiveJob[]
}

const CATEGORIES = [
  'software-dev',
  'customer-support',
  'design',
  'marketing',
  'writing',
  'data',
  'devops',
  'product',
]

function mapJobType(remotive: string): JobType {
  switch (remotive) {
    case 'contract':
    case 'freelance':
      return 'Contract'
    case 'part_time':
      return 'Part-time'
    default:
      return 'Remote'
  }
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchRemotiveJobs(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = []
  const seen = new Set<string>()

  for (const category of CATEGORIES) {
    try {
      const res = await fetch(
        `https://remotive.com/api/remote-jobs?category=${category}&limit=30`,
        { headers: { 'User-Agent': 'Spanispace/1.0 (https://spanispace.com; jobs aggregator)' } }
      )
      if (!res.ok) continue

      const data: RemotiveResponse = await res.json()

      for (const j of data.jobs ?? []) {
        if (!j.url || seen.has(j.url)) continue
        seen.add(j.url)

        results.push({
          title: j.title.trim(),
          description: j.description
            ? stripHtml(j.description).slice(0, 2000)
            : `${j.title} at ${j.company_name}.`,
          requirements: j.tags?.length ? `Skills: ${j.tags.join(', ')}` : 'See job listing for requirements.',
          location: j.candidate_required_location?.trim() || 'Remote - Worldwide',
          job_type: mapJobType(j.job_type),
          salary_range: j.salary?.trim() || '',
          apply_link: j.url,
          expiry_date: daysFromNow(30),
          poster_name: j.company_name || 'Unknown Company',
          source: 'remotive',
        })
      }

      // Polite delay between category requests
      await new Promise((r) => setTimeout(r, 500))
    } catch {
      // Continue with remaining categories if one fails
    }
  }

  return results
}
