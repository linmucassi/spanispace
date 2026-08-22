import { createServerSupabase } from '@/lib/supabase/server'
import { ACADEMIC_UPDATES } from '@/data/constants'
import type { UniversityUpdate } from '@/types'

type DbUniApp = {
  id: string
  institution: string
  programs: string | null
  application_type: string | null
  closing_date: string | null
  notes: string | null
  apply_link: string | null
  status: string
}

/**
 * The `late_uni_apps` table has no logo column, so every institution served
 * from the database arrived with no logo and rendered as a bare monogram. Only
 * the institutions absent from the database, which fall through to the
 * constants below, ever showed a mark. That is why UNISA, UCT, UJ and UP had
 * no image while SAB, CPUT and TUT did.
 *
 * Logos are static brand assets in this repo, not editorial data, so matching
 * them back on by name here is the right seam. It also means adding the logo to
 * data/constants.ts is enough, with no migration and no admin field to fill in.
 */
const LOGO_BY_INSTITUTION = new Map(
  ACADEMIC_UPDATES.filter((u) => u.logo).map((u) => [normaliseName(u.institution), u.logo!])
)

/** 'University of Cape Town (UCT)' and 'university of cape town' must match. */
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function mapDbUniApp(row: DbUniApp): UniversityUpdate {
  return {
    id: row.id,
    institution: row.institution,
    deadline: row.closing_date ?? '',
    type: (row.application_type ?? 'Standard') as UniversityUpdate['type'],
    applyLink: row.apply_link ?? undefined,
    notes: row.notes ?? undefined,
    logo: LOGO_BY_INSTITUTION.get(normaliseName(row.institution)),
  }
}

export async function fetchPublicUniApps(): Promise<UniversityUpdate[]> {
  const supabase = await createServerSupabase()
  if (!supabase) return ACADEMIC_UPDATES

  const { data, error } = await supabase
    .from('late_uni_apps')
    .select('id, institution, programs, application_type, closing_date, notes, apply_link, status')
    .eq('status', 'open')
    .order('closing_date', { ascending: true })

  if (error) {
    console.error('[publicAcademic] Supabase error:', error.message)
    return ACADEMIC_UPDATES
  }
  if (!data || data.length === 0) {
    return ACADEMIC_UPDATES
  }

  // DB is authoritative; supplement with any constants entries not yet in DB
  const dbItems = (data as DbUniApp[]).map(mapDbUniApp)
  const dbNames = new Set(dbItems.map(u => u.institution.toLowerCase()))
  const constantsExtras = ACADEMIC_UPDATES.filter(
    u => !dbNames.has(u.institution.toLowerCase())
  )

  return [...dbItems, ...constantsExtras]
}
