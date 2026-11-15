// Read-only: reports what reconcileScrapedJobs() WOULD do. Writes nothing.
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
import { getSupabaseAdmin } from '../lib/supabase/admin'
import { verifyCompanies, normalizeCompanyName } from '../lib/scrapers/company-verifier'

async function main() {
  const sb = getSupabaseAdmin()
  const rows: { poster_name: string | null; vetted_status: string }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from('jobs').select('poster_name, vetted_status').eq('origin', 'scraped').in('vetted_status', ['pending', 'verified']).order('id').range(from, from + 999)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  const t0 = Date.now()
  const v = await verifyCompanies(rows.map((r) => r.poster_name))
  let keep = 0, del = 0
  const byCompany = new Map<string, { n: number; ok: boolean; site: string | null }>()
  for (const r of rows) {
    const k = normalizeCompanyName(r.poster_name); const verdict = v.get(k)!
    if (verdict.verified) keep++
    else del++
    const e = byCompany.get(r.poster_name ?? '') ?? { n: 0, ok: verdict.verified, site: verdict.website }
    e.n++; byCompany.set(r.poster_name ?? '', e)
  }
  console.log(`rows=${rows.length} companies=${v.size} keep=${keep} delete=${del} secs=${((Date.now()-t0)/1000).toFixed(0)}`)
  const list = [...byCompany.entries()].sort((a, b) => b[1].n - a[1].n)
  console.log('--- verified'); list.filter(([, e]) => e.ok).slice(0, 25).forEach(([n, e]) => console.log(`${e.n}\t${n}\t${e.site}`))
  console.log('--- NOT verified'); list.filter(([, e]) => !e.ok).slice(0, 30).forEach(([n, e]) => console.log(`${e.n}\t${n}`))
}
main()
