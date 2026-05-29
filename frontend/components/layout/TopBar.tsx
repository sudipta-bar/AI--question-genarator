'use client';

import { memo } from 'react';
import { Bell, Menu, Search } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/authStore';

function TopBarComponent({
  breadcrumb,
  onMenuClick,
  onSearchClick,
}: {
  breadcrumb: string;
  onMenuClick: () => void;
  onSearchClick: () => void;
}) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="topbar sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/95 px-3 shadow-[var(--shadow-sm)] backdrop-blur md:ml-[200px] md:px-6">
      <button type="button" aria-label="Open menu" onClick={onMenuClick} className="mobile-only flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
        <Menu className="h-5 w-5" />
      </button>
      <div className="desktop-only text-sm font-semibold">{breadcrumb}</div>
      <div className="mobile-only absolute left-1/2 -translate-x-1/2"><Logo /></div>
      <div className="flex items-center gap-2 md:gap-3">
        <button type="button" aria-label="Search" onClick={onSearchClick} className="mobile-only flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
          <Search className="h-5 w-5" />
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
