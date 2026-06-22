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

function mapDbUniApp(row: DbUniApp): UniversityUpdate {
  return {
    institution: row.institution,
    deadline: row.closing_date ?? '',
    type: (row.application_type ?? 'Standard') as UniversityUpdate['type'],
    applyLink: row.apply_link ?? undefined,
    notes: row.notes ?? undefined,
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

  return (data as DbUniApp[]).map(mapDbUniApp)
}
