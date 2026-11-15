// Verifies that a scraped job's company is real by finding its website.
//
// None of the sources (RemoteOK, Remotive, Adzuna) give us the employer's
// website, only a display name. So we guess: build likely domains from the
// name (acme-holdings -> acmeholdings.com, acmeholdings.co.za, ...), fetch
// each, and accept the first one that is a live HTML page, is not a parked /
// for-sale domain, and mentions the company name.
//
// Policy (15 Nov 2026): a verified company's jobs go live immediately
// (vetted_status 'verified'). A company that cannot be verified has its jobs
// dropped, and any of its scraped jobs already in the database are deleted.
//
// This is a heuristic. It will miss real companies whose domain doesn't match
// their name (e.g. "Shoprite Checkers" -> shoprite.co.za works, but
// "Pick n Pay" -> pnp.co.za won't), and placeholder names like
// "Employer on Adzuna" are always unverifiable.

const FETCH_TIMEOUT_MS = 5000
const CONCURRENCY = 10
const TLDS = ['.com', '.co.za', '.io', '.co', '.ai', '.ca', '.co.uk', '.com.au'] as const

// Names that are placeholders, not companies. Never verifiable.
const PLACEHOLDER = /^(unknown( company)?|employer on adzuna|confidential|private (advertiser|employer|company)|anonymous|n\/?a|recruiter|company)$/i

// Legal / filler words that are never part of a domain.
const NOISE_WORDS = new Set([
  'pty', 'ltd', 'limited', 'inc', 'incorporated', 'llc', 'llp', 'plc', 'gmbh', 'bv', 'sa', 'ag',
  'corp', 'corporation', 'co', 'company', 'the', 'and', 'group', 'holdings', 'npc', 'cc', 'srl',
])

const PARKED = /domain (name )?(is )?for sale|buy this domain|this domain (may be|is) for sale|parked (free|domain)|sedoparking|hugedomains|dan\.com|afternic|godaddy\.com\/domainsearch|domain has expired/i

export type CompanyVerdict = { verified: boolean; website: string | null }

const cache = new Map<string, Promise<CompanyVerdict>>()

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function nameWords(name: string): string[] {
  return decodeEntities(name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !NOISE_WORDS.has(w))
}

export function normalizeCompanyName(name: string | null | undefined): string {
  return nameWords(name ?? '').join(' ')
}

// `exact` = the domain is the whole name (acmelogistics.com), as opposed to
// the first-word fallback (acme.com), which is a weaker signal.
function candidateDomains(name: string): { domain: string; exact: boolean }[] {
  const words = nameWords(name)
  if (words.length === 0) return []
  const out: { domain: string; exact: boolean }[] = []
  const add = (slug: string, exact: boolean) => {
    if (slug.length < 2) return
    for (const tld of TLDS) out.push({ domain: `${slug}${tld}`, exact })
  }
  add(words.join(''), true)
  if (words.length > 1) {
    add(words.join('-'), true)
    add(words[0], false) // "Acme Logistics" -> acme.com
  }
  return out
}

// Big brands (Hilton, Tesco, Toptal) sit behind bot protection and answer a
// script with 403/429/503 rather than the page. A protected site on the
// exact-name .com/.co.za is strong evidence the company is real.
const BOT_BLOCKED = new Set([401, 403, 429, 503])

async function fetchText(url: string): Promise<{ ok: boolean; blocked: boolean; finalUrl: string; html: string }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SpanispaceBot/1.0)', Accept: 'text/html' },
    })
    const type = res.headers.get('content-type') ?? ''
    if (BOT_BLOCKED.has(res.status)) return { ok: false, blocked: true, finalUrl: res.url, html: '' }
    if (!res.ok || !type.includes('html')) return { ok: false, blocked: false, finalUrl: res.url, html: '' }
    // Only the head of the page matters (title, meta, header, nav).
    const html = (await res.text()).slice(0, 200_000)
    return { ok: true, blocked: false, finalUrl: res.url, html }
  } catch {
    return { ok: false, blocked: false, finalUrl: url, html: '' }
  } finally {
    clearTimeout(timer)
  }
}

function pageMentionsCompany(html: string, name: string): boolean {
  const text = decodeEntities(html).toLowerCase().replace(/\s+/g, ' ')
  const words = nameWords(name)
  if (words.length === 0) return false
  // The full name (spaced or joined) appearing anywhere is a strong match.
  if (text.includes(words.join(' ')) || text.includes(words.join(''))) return true
  // Otherwise every significant word (3+ chars) must appear.
  const significant = words.filter((w) => w.length >= 3)
  return significant.length > 0 && significant.every((w) => text.includes(w))
}

async function verifyUncached(name: string): Promise<CompanyVerdict> {
  if (!name.trim() || PLACEHOLDER.test(name.trim())) return { verified: false, website: null }
  const words = nameWords(name)
  for (const { domain, exact } of candidateDomains(name)) {
    const { ok, blocked, finalUrl, html } = await fetchText(`https://${domain}`)
    if (blocked && exact && /\.(com|co\.za)$/.test(domain)) return { verified: true, website: `https://${domain}` }
    if (!ok || PARKED.test(html)) continue
    // First-word fallback domains (stone.com for "Stone Logistics") must
    // show the full name, not just each word somewhere on the page.
    const mentioned = exact
      ? pageMentionsCompany(html, name)
      : decodeEntities(html).toLowerCase().includes(words.join(' '))
    if (mentioned) return { verified: true, website: finalUrl }
  }
  return { verified: false, website: null }
}

export function verifyCompany(name: string | null | undefined): Promise<CompanyVerdict> {
  const key = normalizeCompanyName(name)
  let hit = cache.get(key)
  if (!hit) {
    hit = verifyUncached(name ?? '')
    cache.set(key, hit)
  }
  return hit
}

// Verifies many names with bounded concurrency. Returns a map keyed by
// normalizeCompanyName(name).
export async function verifyCompanies(names: (string | null | undefined)[]): Promise<Map<string, CompanyVerdict>> {
  const unique = new Map<string, string>()
  for (const n of names) {
    const key = normalizeCompanyName(n)
    if (!unique.has(key)) unique.set(key, n ?? '')
  }
  const entries = Array.from(unique.entries())
  const out = new Map<string, CompanyVerdict>()
  let next = 0
  async function worker() {
    while (next < entries.length) {
      const [key, raw] = entries[next++]
      out.set(key, await verifyCompany(raw))
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, entries.length) }, worker))
  return out
}
