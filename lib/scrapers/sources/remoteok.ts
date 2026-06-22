// RemoteOK public JSON API — no API key required
// Docs: https://remoteok.com/api
// Policy: free to use, first element in array is a legal disclaimer object to skip

import type { ScrapedJob } from '../types'

interface RemoteOKJob {
  id: string
  epoch: number
  date: string
  company: string
  position: string
  description: string
  tags: string[]
  location: string
  salary_min?: number
  salary_max?: number
  url: string
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function buildSalaryRange(min?: number, max?: number): string {
  if (!min && !max) return ''
  if (min && max) return `$${Math.round(min / 1000)}k – $${Math.round(max / 1000)}k/yr`
  if (min) return `From $${Math.round(min / 1000)}k/yr`
  return ''
}

export async function fetchRemoteOKJobs(): Promise<ScrapedJob[]> {
  const res = await fetch('https://remoteok.com/api', {
    headers: { 'User-Agent': 'Spanispace/1.0 (https://spanispace.com; jobs aggregator)' },
  })
  if (!res.ok) throw new Error(`RemoteOK responded ${res.status}`)

  const raw: unknown[] = await res.json()
  // First element is a legal notice object, skip it
  const items = raw.slice(1) as RemoteOKJob[]

  return items
    .filter((j) => j.position && j.url)
    .slice(0, 60) // cap to avoid overwhelming DB on first run
    .map((j) => ({
      title: j.position.trim(),
      description: j.description
        ? j.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000)
        : `${j.position} at ${j.company}. Remote position open worldwide including South Africa.`,
      requirements: j.tags?.length ? `Skills: ${j.tags.join(', ')}` : 'See job listing for requirements.',
      location: 'Remote - Worldwide',
      job_type: 'Remote',
      salary_range: buildSalaryRange(j.salary_min, j.salary_max),
      apply_link: j.url,
      expiry_date: daysFromNow(30),
      poster_name: j.company || 'Unknown Company',
      source: 'remoteok',
    }))
}
