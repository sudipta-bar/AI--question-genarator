'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { Building2, Settings, Sparkles, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/authStore';
import { appNavLinks } from './navigation';

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || (pathname.includes('/result') && href === '/toolkit');
}

function NavItems({ includeSettings = false, onNavigate }: { includeSettings?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = includeSettings ? appNavLinks : appNavLinks.filter((link) => link.href !== '/settings');

  return (
    <>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={isActive ? 'motion-press relative flex items-center gap-3 rounded-2xl border border-[#FED7C3] bg-[#FFF4EE] px-4 py-3 text-sm font-semibold text-[#111827] shadow-[inset_0_0_0_1px_rgba(255,107,53,0.08)] transition-all duration-200 before:absolute before:left-2 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[var(--primary)] before:transition-all before:duration-200 dark:border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] dark:bg-[color-mix(in_srgb,var(--primary)_14%,var(--surface-subtle))] dark:text-[var(--text)]' : 'motion-press flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-[var(--muted)] transition-all duration-200 hover:border-[#E5E7EB] hover:bg-[#F5F5F7] hover:text-[#111827] dark:hover:border-[var(--border)] dark:hover:bg-[var(--surface-subtle)] dark:hover:text-[var(--text)]'}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{link.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function ProfileBlock() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-3 mb-4 flex items-center gap-3 rounded-[20px] border border-[#E5E7EB] bg-[#F5F5F7] p-3.5 shadow-[var(--shadow-sm)] dark:border-[var(--border)] dark:bg-[var(--surface-subtle)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--action)] text-[var(--action-contrast)] shadow-sm">
        {user?.profileImage ? <UserAvatar user={user} size="sm" className="border-0" /> : <Building2 className="h-4 w-4" />}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--text)]">{user?.schoolName || 'Delhi Public School'}</div>
        <div className="truncate text-xs text-[var(--muted)]">{user?.city || 'Bokaro Steel City'}</div>
      </div>
    </div>
  );
}

function SidebarComponent({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside className="sidebar desktop-only fixed left-3 top-3 z-40 flex h-[calc(100dvh-24px)] w-[248px] flex-shrink-0 flex-col rounded-[24px] border border-[#E5E7EB] bg-[#FAFAFA] shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:border-[var(--border)] dark:bg-[var(--sidebar-bg)] dark:shadow-[var(--shadow-md)]">
        <div className="px-6 pb-5 pt-5"><Logo /></div>
        <div className="px-3">
          <Link className="btn-base btn-dark motion-halo w-full font-semibold tracking-[-0.01em]" href="/assignments/create">
            <Sparkles className="h-4 w-4" />
            <span>Create Assignment</span>
          </Link>
        </div>
        <nav className="mt-6 flex-1 space-y-1.5 px-3 animate-fade-left">
          <NavItems />
        </nav>
        <div className="mt-auto">
          <Link href="/settings" className="motion-press mx-3 mb-3 flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]">
            <Settings className="h-5 w-5 shrink-0" />
            <span>Settings</span>
          </Link>
          <ProfileBlock />
        </div>
      </aside>

      <div className={`mobile-only fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
      <aside className={`mobile-only fixed inset-y-0 left-0 z-50 flex w-[min(86vw,340px)] flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] shadow-[var(--shadow-md)] transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
          <Logo />
          <button type="button" aria-label="Close menu" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-4">
          <Link onClick={onClose} className="btn-base btn-dark motion-halo w-full" href="/assignments/create">
            <Sparkles className="h-4 w-4" />
            <span>Create Assignment</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4 animate-fade-left">
          <NavItems includeSettings onNavigate={onClose} />
        </nav>
        <div className="border-t border-[var(--border)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <ProfileBlock />
        </div>
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);
