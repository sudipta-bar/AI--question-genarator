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
    <header className={`topbar fixed left-3 right-3 top-4 z-30 flex h-[72px] items-center justify-between rounded-[32px] border border-[#E8E8E8] px-6 transition-all duration-[350ms] ease-out md:left-[372px] md:right-6 ${scrolled ? 'bg-[rgba(255,255,255,.92)] shadow-[0_20px_60px_rgba(0,0,0,.12)] backdrop-blur-[20px]' : 'bg-white shadow-[0_10px_40px_rgba(0,0,0,.05)] backdrop-blur-[10px]'}`}>
      <button type="button" aria-label="Open menu" onClick={onMenuClick} className="mobile-only motion-press flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-soft)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
        <Menu className="h-5 w-5" />
      </button>
      <div className="desktop-only flex items-center gap-3">
        <button type="button" aria-label="Back" className="motion-press flex h-10 w-10 items-center justify-center rounded-full text-[#111827] transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-subtle)]">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <button type="button" aria-label="Grid" className="motion-press flex h-10 w-10 items-center justify-center rounded-full text-[#111827] transition-all hover:-translate-y-0.5 hover:bg-[var(--surface-subtle)]">
          <Grid3X3 className="h-6 w-6" />
        </button>
        <div className="text-lg font-medium text-[#A29A94] dark:text-[var(--text)]">{breadcrumb}</div>
      </div>
      <div className="mobile-only absolute left-1/2 -translate-x-1/2"><Logo /></div>
      <div className="flex items-center gap-2 md:gap-3">
        <button type="button" aria-label="Open quick links" onClick={onSearchClick} className="mobile-only motion-press flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-soft)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <div className="desktop-only flex items-center gap-3">
          <button type="button" aria-label="Notifications" className="motion-press relative flex h-12 w-12 items-center justify-center rounded-full border border-[#E8E8E8] bg-white text-[#111827] shadow-[var(--shadow-sm)] transition-all hover:scale-[1.03] hover:bg-[var(--surface-subtle)] dark:border-[var(--border)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text)]">
            <Bell className={`h-6 w-6 ${ring ? 'animate-bell-swing' : ''}`} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-600" />
          </button>
          <div className="motion-press flex h-[52px] items-center gap-2 rounded-full border border-[#E8E8E8] bg-white px-3 shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-subtle)] dark:border-[var(--border)] dark:bg-[var(--surface-elevated)]">
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
