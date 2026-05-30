'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bell, ChevronDown, Grid3X3, Menu, MoreHorizontal } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { useGenerationStore } from '@/store/generationStore';

function TopBarComponent({
  breadcrumb,
  onMenuClick,
  onSearchClick,
  scrolled,
}: {
  breadcrumb: string;
  onMenuClick: () => void;
  onSearchClick: () => void;
  scrolled: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const generationStatus = useGenerationStore((s) => s.status);
  const [ring, setRing] = useState(false);
  const previousStatus = useRef(generationStatus);

  useEffect(() => {
    if (previousStatus.current !== generationStatus && (generationStatus === 'completed' || generationStatus === 'failed')) {
      setRing(true);
      const timer = window.setTimeout(() => setRing(false), 600);
      previousStatus.current = generationStatus;
      return () => window.clearTimeout(timer);
    }
    previousStatus.current = generationStatus;
  }, [generationStatus]);

  return (
    <header className={`topbar fixed left-3 right-3 top-3 z-30 flex h-16 items-center justify-between rounded-[20px] border px-3 transition-all duration-300 ease-out md:left-[284px] md:right-4 md:px-6 ${scrolled ? 'border-[var(--nav-scrolled-border)] bg-[var(--nav-bg)] shadow-[var(--nav-shadow)] backdrop-blur-[18px]' : 'border-[var(--nav-border)] bg-[var(--nav-top-bg)] shadow-[var(--nav-top-shadow)] backdrop-blur-[16px]'}`}>
      <button type="button" aria-label="Open menu" onClick={onMenuClick} className="mobile-only motion-press flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-soft)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
        <Menu className="h-5 w-5" />
      </button>
      <div className="desktop-only flex items-center gap-3">
        <button type="button" aria-label="Back" className="motion-press flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-soft)] transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Grid" className="motion-press flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-soft)] transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]">
          <Grid3X3 className="h-5 w-5" />
        </button>
        <div className="text-sm font-semibold text-[var(--text)]">{breadcrumb}</div>
      </div>
      <div className="mobile-only absolute left-1/2 -translate-x-1/2"><Logo /></div>
      <div className="flex items-center gap-2 md:gap-3">
        <button type="button" aria-label="Open quick links" onClick={onSearchClick} className="mobile-only motion-press flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-soft)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <div className="desktop-only flex items-center gap-3">
          <button type="button" aria-label="Notifications" className="motion-press relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition-all hover:scale-[1.03] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]">
            <Bell className={`h-5 w-5 ${ring ? 'animate-bell-swing' : ''}`} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-600" />
          </button>
          <div className="motion-press flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] py-1 pl-1 pr-3 shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-subtle)]">
            <UserAvatar user={user} size="sm" />
            <span className="text-sm font-medium text-[var(--text)]">{user?.name ?? 'John Doe'}</span>
            <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
          </div>
        </div>
      </div>
    </header>
  );
}

export const TopBar = memo(TopBarComponent);
