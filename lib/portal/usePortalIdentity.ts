'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Portal = 'candidate' | 'company' | 'admin';

export type PortalIdentity = { name: string; email: string; picture: string | null };

/**
 * Who is signed in to this portal, for the sidebar card and the top-right
 * profile menu: the candidate's name and avatar, the company's name and logo
 * (owner login, or a team member through company_members), or the admin's
 * email.
 */
export function usePortalIdentity(portal: Portal): PortalIdentity {
  const [identity, setIdentity] = useState<PortalIdentity>({ name: '', email: '', picture: null });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const email = user.email ?? '';
      const fallback = email.split('@')[0];
      if (portal === 'candidate') {
        const { data } = await supabase.from('candidate_profiles').select('full_name, avatar_url').eq('user_id', user.id).maybeSingle();
        setIdentity({ name: data?.full_name || fallback || 'Me', email, picture: data?.avatar_url ?? null });
      } else if (portal === 'company') {
        const { data: owned } = await supabase.from('company_profiles').select('company_name, logo_url').eq('user_id', user.id).maybeSingle();
        let company = owned;
        if (!company) {
          const { data: membership } = await supabase
            .from('company_members')
            .select('company:company_profiles(company_name, logo_url)')
            .eq('user_id', user.id)
            .maybeSingle();
          const c = membership?.company;
          company = (Array.isArray(c) ? c[0] : c) ?? null;
        }
        setIdentity({ name: company?.company_name || fallback || 'Company', email, picture: company?.logo_url ?? null });
      } else {
        setIdentity({ name: fallback || 'Admin', email, picture: null });
      }
    }
    load();
  }, [portal]);

  return identity;
}
