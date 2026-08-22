import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { acceptPlatformInvite } from '@/lib/invites/acceptInvite';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');

  // Only a same origin relative path may be the post login target. Without this,
  // ?next=https://evil.com or ?next=//evil.com sends a freshly signed in user
  // straight off the site, which is an open redirect worth phishing with.
  const rawNext = searchParams.get('next') ?? '/';
  const next =
    rawNext.startsWith('/') && !rawNext.startsWith('//') && !rawNext.startsWith('/\\')
      ? rawNext
      : '/';

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Can fail in Server Components (read-only cookies)
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  // Determine redirect based on user role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  // Confirmation-email path for an invite-based signup -- register/page.tsx
  // appends ?invite=<token> to emailRedirectTo when Supabase confirmation is
  // required and no session exists immediately after signUp(). Best effort:
  // an invalid/expired token here just means the person keeps whatever role
  // signup gave them, same as the direct-session path in
  // app/api/invites/accept/route.ts.
  const inviteToken = searchParams.get('invite');
  if (inviteToken && user.email) {
    await acceptPlatformInvite(user.id, user.email, inviteToken).catch((err) => {
      console.error('[callback] invite acceptance failed:', err);
    });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  let redirectPath = next;

  // Only override redirect if no specific next path was provided
  if (next === '/' && userData?.role) {
    switch (userData.role) {
      case 'admin':
      case 'super_admin':
        redirectPath = '/admin/dashboard';
        break;
      case 'company':
        redirectPath = '/company/dashboard';
        break;
      case 'candidate':
      default: {
        // Someone added as company staff (company_members) keeps their base
        // role but still belongs in the company portal -- see
        // supabase/add-roles-invites-and-calendar.sql PART C.
        const { data: membership } = await supabase
          .from('company_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        redirectPath = membership ? '/company/dashboard' : '/candidate/dashboard';
        break;
      }
    }
  }

  return NextResponse.redirect(new URL(redirectPath, origin));
}
