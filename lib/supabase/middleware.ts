import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;

  if (!url || !key) {
    // Supabase not configured -- block protected routes, allow public
    if (
      (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) ||
      pathname.startsWith('/candidate') ||
      pathname.startsWith('/company')
    ) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Determine if this is a protected route and which role it requires
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isCandidateRoute = pathname.startsWith('/candidate');
  const isCompanyRoute = pathname.startsWith('/company');
  const isProtectedRoute = isAdminRoute || isCandidateRoute || isCompanyRoute;

  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  // Not authenticated -- redirect to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch user role from the users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userData?.role;

  // Check role matches the route. 'admin' route accepts super_admin too
  // (is_admin() in RLS does the same widening -- see
  // supabase/add-roles-invites-and-calendar.sql).
  if (isAdminRoute && role !== 'admin' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isCandidateRoute && role !== 'candidate') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // A company_members row (added as staff to a company) grants /company/*
  // access even when the base users.role is something else, e.g. a
  // candidate added as a company's recruiter. Only queried when the fast
  // path (role === 'company', the original owner) doesn't already pass --
  // see supabase/add-roles-invites-and-calendar.sql PART C.
  if (isCompanyRoute && role !== 'company') {
    const { data: membership } = await supabase
      .from('company_members')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Every candidate needs a phone number on file -- most often missing after a
  // Google sign-in, since Google never supplies one, but this also catches
  // existing accounts created back when the signup form's phone field was
  // optional. Applies to every /candidate/* request except the onboarding
  // page itself, which is where they fix it.
  if (isCandidateRoute && role === 'candidate' && !pathname.startsWith('/candidate/onboarding')) {
    const { data: profile } = await supabase
      .from('candidate_profiles')
      .select('phone')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.phone) {
      const onboardingUrl = new URL('/candidate/onboarding', request.url);
      onboardingUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return supabaseResponse;
}
