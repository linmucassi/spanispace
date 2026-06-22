// Dev-only diagnostic endpoint — remove before shipping to production
// Visit http://localhost:3000/api/debug to see connection status

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()

  if (!supabase) {
    return NextResponse.json({
      connected: false,
      reason: 'Supabase client could not be created — check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
    })
  }

  const today = new Date().toISOString().split('T')[0]

  const [allJobs, activeJobs, learnerships] = await Promise.all([
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
    supabase.from('jobs').select('id', { count: 'exact', head: true })
      .eq('vetted_status', 'verified')
      .eq('status', 'active')
      .gte('expiry_date', today),
    supabase.from('learnerships').select('id', { count: 'exact', head: true }),
  ])

  return NextResponse.json({
    connected: true,
    today,
    jobs: {
      total: allJobs.count ?? 0,
      activeAndVerified: activeJobs.count ?? 0,
      error: activeJobs.error?.message ?? null,
    },
    learnerships: {
      total: learnerships.count ?? 0,
      error: learnerships.error?.message ?? null,
    },
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
  })
}
