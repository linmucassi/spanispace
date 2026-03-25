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

  // Check role matches the route
  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isCandidateRoute && role !== 'candidate') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isCompanyRoute && role !== 'company') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}
