// Every app/company/* page used to resolve "which company am I" as
// company_profiles.user_id = auth.uid() directly -- true 1:1, exactly one
// login per company. Since supabase/add-roles-invites-and-calendar.sql
// PART C, a company can have a real team (owner/admin/manager/member/viewer
// via company_members), so this now checks membership instead. The
// UNIQUE(user_id) constraint on company_members guarantees at most one row
// per person (one person, one company, in v1), so this is still a single
// query with a single result.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CompanyRole } from '@/types/database';

export interface CompanyMembership {
  companyId: string;
  role: CompanyRole;
  companyName: string;
}

// role IN ('owner','admin','manager','member') -- everything operational
// (post/edit jobs, events, training, act on applications, message
// candidates, send invites). 'viewer' is read-only and excluded.
export function canOperate(role: CompanyRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager' || role === 'member';
}

// role IN ('owner','admin') -- manage the team roster and company
// profile/settings.
export function canManage(role: CompanyRole): boolean {
  return role === 'owner' || role === 'admin';
}

// Checks the original owner path first (company_profiles.user_id --
// unchanged from before this feature, so an existing owner's behavior is
// byte-for-byte identical), then falls back to company_members for anyone
// added as staff. Single call site per page, one query in the common case.
// Returns company_name too (a plain column on the same row/join, no extra
// round trip) so callers like app/company/dashboard/page.tsx don't need a
// second query just to get the name back.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveCompanyMembership(supabase: SupabaseClient<any>, userId: string): Promise<CompanyMembership | null> {
  const { data: owned } = await supabase
    .from('company_profiles')
    .select('id, company_name')
    .eq('user_id', userId)
    .maybeSingle();
  if (owned) return { companyId: owned.id, role: 'owner', companyName: owned.company_name };

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id, role, company_profiles(company_name)')
    .eq('user_id', userId)
    .maybeSingle();
  if (!member) return null;
  const companyProfile = Array.isArray(member.company_profiles) ? member.company_profiles[0] : member.company_profiles;
  return { companyId: member.company_id, role: member.role as CompanyRole, companyName: companyProfile?.company_name ?? '' };
}
