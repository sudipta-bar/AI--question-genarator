'use client';

import { memo } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/authStore';

function TopBarComponent({ breadcrumb }: { breadcrumb: string }) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="topbar sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-4 shadow-[var(--shadow-sm)] backdrop-blur md:ml-[200px] md:px-6">
      <div className="desktop-only text-sm font-semibold">{breadcrumb}</div>
      <div className="mobile-only mx-auto"><Logo /></div>
      <div className="flex items-center gap-3">
        <button aria-label="Search" className="mobile-only rounded-md p-2 hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
          <Search className="h-4 w-4" />
        </button>
        <button aria-label="Menu" className="mobile-only rounded-md p-2 hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
          <Menu className="h-4 w-4" />
        </button>
        <div className="desktop-only flex items-center gap-2">
          <UserAvatar user={user} size="sm" />
          <Bell className="h-4 w-4 text-[var(--muted)]" />
        </div>
      </div>
    </header>
  );
}

export const TopBar = memo(TopBarComponent);
