import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ─── Proxy (Next.js 16 replacement for middleware) ────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow direct access to admin login page
  if (pathname === '/admin/login') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || 'knowurcoach-secret-key-agra-2026',
    });
    // If already logged in as ADMIN, redirect to /admin dashboard
    if (token && token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Resolve JWT token from cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'knowurcoach-secret-key-agra-2026',
  });

  const isAuthenticated = Boolean(token);
  const userRole = (token?.role as string | undefined) || 'GUEST';

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

export default proxy;
