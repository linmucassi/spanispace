#!/usr/bin/env tsx
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
import { getSupabaseAdmin } from '../lib/supabase/admin'

// Mojibake detection: if this text is actually UTF-8 bytes of some other
// script (CJK, Cyrillic, Arabic, etc.) that got misread as Latin-1/CP1252
// somewhere in the pipeline, re-interpreting each character as a raw byte
// and re-decoding as UTF-8 recovers the original script.
function isMojibake(text: string): boolean {
  if (!text) return false
  try {
    const bytes = Buffer.from(text, 'latin1')
    const redecoded = bytes.toString('utf8')
    if (redecoded.includes('�')) return false // invalid utf8, not mojibake
    return /[一-鿿぀-ヿ가-힯؀-ۿЀ-ӿ]/.test(redecoded)
  } catch {
    return false
  }
}

async function main() {
  const supabase = getSupabaseAdmin()
  const PAGE = 1000
  let from = 0
  const bad: { id: string; title: string; poster_name: string | null; location: string }[] = []
  let total = 0

  while (true) {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, poster_name, location, description, requirements')
      .range(from, from + PAGE - 1)
    if (error) { console.error(error.message); break }
    if (!data || data.length === 0) break
    total += data.length
    for (const row of data) {
      if (isMojibake(row.title) || isMojibake(row.poster_name ?? '') || isMojibake(row.location)) {
        bad.push({ id: row.id, title: row.title, poster_name: row.poster_name, location: row.location })
      }
    }
    if (data.length < PAGE) break
    from += PAGE
  }

  console.log(`Scanned ${total} jobs, found ${bad.length} with mojibake:`)
  console.log(JSON.stringify(bad, null, 2))
}
main()
