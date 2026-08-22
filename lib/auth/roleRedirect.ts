import type { SupabaseClient } from '@supabase/supabase-js';
import type { useRouter } from 'next/navigation';

type Router = ReturnType<typeof useRouter>;

// Shared by password login and Google sign-in on both /login and /register
// (the Google button there is only shown under the candidate tab, but an
// existing Google account could belong to a company that registered with
// email/password first, so it still needs a real role lookup rather than
// assuming candidate).
export async function redirectToDashboard(
  supabase: SupabaseClient,
  router: Router,
  userId: string,
  roleCheckFailedMessage: string,
  onError: (message: string) => void,
) {
  const { data: userData, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !userData) {
    onError(roleCheckFailedMessage);
    return;
  }

  switch (userData.role) {
    case 'admin':
    case 'super_admin':
      router.push('/admin/dashboard');
      break;
    case 'company':
      router.push('/company/dashboard');
      break;
    case 'candidate':
    default: {
      // A candidate (or any other base role) added as company staff via
      // company_members still routes to the company portal -- see
      // supabase/add-roles-invites-and-calendar.sql PART C.
      const { data: membership } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      router.push(membership ? '/company/dashboard' : '/candidate/dashboard');
      break;
    }
  }
}
