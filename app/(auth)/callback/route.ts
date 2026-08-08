import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

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
        redirectPath = '/admin/dashboard';
        break;
      case 'company':
        redirectPath = '/company/dashboard';
        break;
      case 'candidate':
        redirectPath = '/candidate/dashboard';
        break;
    }
  }

  return NextResponse.redirect(new URL(redirectPath, origin));
}
