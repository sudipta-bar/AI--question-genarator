import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/login', '/register', '/forgot-password'];
const protectedRoutes = ['/home', '/groups', '/assignments', '/toolkit', '/library', '/settings'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasRefreshCookie = request.cookies.has('refreshToken');
  const isPublic = publicRoutes.includes(path) || path.startsWith('/reset-password/');
  const isProtected = protectedRoutes.some((route) => path === route || path.startsWith(`${route}/`));

  if (isPublic && hasRefreshCookie) return NextResponse.redirect(new URL('/home', request.url));
  if ((isProtected || !isPublic) && !hasRefreshCookie) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*|images|favicon.ico).*)'],
};
