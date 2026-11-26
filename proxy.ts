import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { pathMembersDestination } from '@/lib/return-destination';

// Routes that do NOT require authentication.
const PUBLIC_ROUTES = [
  '/',
  '/explore',
  '/auth',
  '/start-learning',
  '/docs',
  '/about',
  '/blog',
  '/paths',
  '/robots.txt',
  '/sitemap.xml',
  '/api/wall',
  '/api/paths/',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public routes and Next.js internals pass through.
  const isPublic =
    PUBLIC_ROUTES.some((r) => {
      if (r === '/') return pathname === '/';
      if (r.endsWith('/')) return pathname.startsWith(r);
      return pathname === r || pathname.startsWith(r + '/');
    }) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — required so Supabase SSR can rotate expired tokens.
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users trying to access protected routes.
  if (!user && !pathname.startsWith('/api/')) {
    const destination = new URL('/auth', request.url);
    const next = pathname === '/account/path-members'
      ? pathMembersDestination(request.nextUrl.searchParams.get('path') ?? '') ?? pathname
      : pathname;
    destination.searchParams.set('next', next);
    return NextResponse.redirect(destination);
  }

  // API routes return 401, not a redirect.
  if (!user && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user) {
    const { data: active, error } = await supabase.rpc('current_account_is_active');
    if (error) return new NextResponse('Unable to verify account access.', { status: 503 });
    if (!active) return new NextResponse('This account is suspended.', { status: 403 });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
