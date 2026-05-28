'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { plainApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';

const publicRoutes = ['/login', '/register', '/forgot-password'];
const protectedRoutes = ['/home', '/groups', '/assignments', '/toolkit', '/library', '/settings'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = publicRoutes.includes(pathname) || pathname.startsWith('/reset-password/');
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    setLoading(true);
    plainApi
      .get('/api/auth/me')
      .then(({ data }) => {
        setAuth(data.user, data.accessToken);
        if (isPublic) router.replace('/home');
      })
      .catch(() => {
        clearAuth();
        if (isProtected || !isPublic) router.replace('/login');
      });
  }, [clearAuth, isProtected, isPublic, pathname, router, setAuth, setLoading]);

  if (isLoading || (!isPublic && !isAuthenticated)) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  }

  return <>{children}</>;
}
