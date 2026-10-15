import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Robustly resolves the NextAuth JWT token across production HTTPS
 * (__Secure-next-auth.session-token), local development (next-auth.session-token),
 * and reverse proxies.
 */
async function getAuthToken(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || 'knowurcoach-secret-key-agra-2026';

  // 1. Check for secure cookie (__Secure-next-auth.session-token) present in HTTPS/production
  const hasSecureCookie =
    request.cookies.has('__Secure-next-auth.session-token') ||
    request.cookies.getAll().some((c) => c.name.startsWith('__Secure-next-auth.session-token'));

  if (hasSecureCookie) {
    try {
      const token = await getToken({
        req: request,
        secret,
        cookieName: '__Secure-next-auth.session-token',
        secureCookie: true,
      });
      if (token) return token;
    } catch {}
  }

  // 2. Check for standard un-prefixed cookie (next-auth.session-token) present in HTTP/localhost
  const hasPlainCookie =
    request.cookies.has('next-auth.session-token') ||
    request.cookies.getAll().some((c) => c.name.startsWith('next-auth.session-token'));

  if (hasPlainCookie) {
    try {
      const token = await getToken({
        req: request,
        secret,
        cookieName: 'next-auth.session-token',
        secureCookie: false,
      });
      if (token) return token;
    } catch {}
  }

  // 3. Fallback: default resolution
  try {
    const token = await getToken({
      req: request,
      secret,
    });
    if (token) return token;
  } catch {}

  // 4. Fallback: try explicit secure resolution
  try {
    const token = await getToken({
      req: request,
      secret,
      cookieName: '__Secure-next-auth.session-token',
      secureCookie: true,
    });
    if (token) return token;
  } catch {}

  return null;
}

// ─── Proxy (Next.js 16 replacement for middleware) ────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getAuthToken(request);
  const isAuthenticated = Boolean(token);
  const userRole = String(token?.role || 'GUEST').trim().toUpperCase();

  // Allow direct access to admin login page
  if (pathname === '/admin/login') {
    // If already logged in as ADMIN, redirect to /admin dashboard
    if (isAuthenticated && userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // 1. Admin direct protection (redirects to /admin/login)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const adminLoginUrl = new URL('/admin/login', request.url);
      adminLoginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. Parent & Coach protected routes (redirects to /login)
  if (pathname.startsWith('/parent')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'PARENT' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/coach')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'COACH' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 3. If already authenticated and hitting the login page, redirect to dashboard
  if (pathname === '/login' && isAuthenticated) {
    let dashboardUrl = '/';
    if (userRole === 'PARENT') dashboardUrl = '/parent/bookings';
    else if (userRole === 'COACH') dashboardUrl = '/coach/dashboard';
    else if (userRole === 'ADMIN') dashboardUrl = '/admin';
    return NextResponse.redirect(new URL(dashboardUrl, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public assets
     * - API routes (auth handles its own security)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)',
  ],
};

export const middleware = proxy;
export default proxy;
