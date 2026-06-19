import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const path = request.nextUrl.pathname;

  // Read admin auth status from cookie
  const isAdminAuthenticated = request.cookies.get('livewall_admin_session')?.value === 'true';

  // Protect admin paths, except the login page itself
  if (path.startsWith('/admin') && path !== '/admin/login') {
    if (!isAdminAuthenticated) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect to dashboard if authenticated user accesses login page
  if (path === '/admin/login') {
    if (isAdminAuthenticated) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle root of admin redirecting to dashboard
  if (path === '/admin') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
