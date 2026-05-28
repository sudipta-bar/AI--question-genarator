import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/register', '/forgot-password'];
const protectedRoutes = ['/home', '/groups', '/assignments', '/toolkit', '/library', '/settings'];

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasRefreshCookie = Boolean(request.cookies.get('refreshToken')?.value);
  const isPublic = publicRoutes.includes(path) || path.startsWith('/reset-password/');
  const isProtected = protectedRoutes.some((route) => path === route || path.startsWith(`${route}/`));

  if (isPublic && hasRefreshCookie) return redirectTo(request, '/home');
  if ((isProtected || !isPublic) && !hasRefreshCookie) return redirectTo(request, '/login');
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
