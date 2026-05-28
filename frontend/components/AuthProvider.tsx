'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { plainApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((state) => state.isLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname.startsWith('/reset-password/')) {
      setLoading(false);
      return;
    }

    plainApi
      .get('/api/auth/me')
      .then(({ data }) => setAuth(data.user, data.accessToken))
      .catch(() => setLoading(false));
  }, [pathname, setAuth, setLoading]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  }
  return <>{children}</>;
}
