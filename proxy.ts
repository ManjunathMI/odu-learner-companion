import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that do NOT require authentication.
const PUBLIC_ROUTES = ['/', '/auth', '/docs/', '/api/wall', '/api/paths/'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public routes and Next.js internals pass through.
  if (
    PUBLIC_ROUTES.some((r) => r.endsWith('/') ? pathname.startsWith(r) : pathname === r || pathname.startsWith(r + '/')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
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
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // API routes return 401, not a redirect.
  if (!user && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
