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
            className={isActive ? 'motion-press relative flex h-[50px] w-full items-center gap-3.5 rounded-[20px] border border-[#F0C8B5] bg-[#F6EEEA] px-4 pl-11 text-base font-medium leading-normal text-[#111827] transition-all duration-[250ms] ease-out before:absolute before:left-4 before:top-1/2 before:h-[48px] before:w-[6px] before:-translate-y-1/2 before:rounded-full before:bg-[#FF6B35] dark:border-[color-mix(in_srgb,var(--primary)_36%,var(--border))] dark:bg-[color-mix(in_srgb,var(--primary)_14%,var(--surface-subtle))] dark:text-[var(--text)]' : 'motion-press flex h-[50px] w-full cursor-pointer items-center gap-3.5 rounded-[20px] px-4 text-base font-medium leading-normal text-[#6B7280] transition-all duration-[250ms] ease-out hover:translate-x-1 hover:bg-[#F8F8F8] dark:text-[var(--muted)] dark:hover:bg-[var(--surface-subtle)] dark:hover:text-[var(--text)]'}
          >
            <Icon className="h-[22px] w-[22px] shrink-0" />
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
    <div className="mt-1 flex h-auto w-full items-center gap-3 rounded-[22px] border border-[#ECECEC] bg-[#F8F8F8] p-3 shadow-none dark:border-[var(--border)] dark:bg-[var(--surface-subtle)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--action)] text-[var(--action-contrast)] shadow-sm">
        {user?.profileImage ? <UserAvatar user={user} size="sm" className="h-11 w-11 border-0" /> : <Building2 className="h-5 w-5" />}
      </div>
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-[#111827] dark:text-[var(--text)]">{user?.schoolName || 'Delhi Public School'}</div>
        <div className="truncate text-sm font-normal text-[#6B7280] dark:text-[var(--muted)]">{user?.city || 'Bokaro Steel City'}</div>
      </div>
    </div>
  );
}

function SidebarComponent({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside className="sidebar desktop-only fixed left-4 top-4 z-40 flex h-[calc(100vh-32px)] w-[332px] min-w-[332px] max-w-[332px] flex-shrink-0 flex-col overflow-hidden rounded-[32px] border border-[#ECECEC] bg-white p-5 shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_24px_rgba(0,0,0,0.12)] backdrop-blur-[10px] dark:border-[var(--border)] dark:bg-[var(--sidebar-bg)] dark:shadow-[0_32px_48px_rgba(0,0,0,0.20),0_16px_24px_rgba(0,0,0,0.12)]">
        <div className="mb-7 flex items-center"><Logo large /></div>
        <div>
          <Link className="motion-halo mx-auto flex h-[58px] w-full max-w-[292px] translate-y-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-4 border-[#FF7849] bg-[linear-gradient(135deg,#1F2433,#071A44)] px-5 text-xl font-bold tracking-[-0.01em] text-white shadow-[0_0_0_8px_#F8D7CC,0_15px_35px_rgba(0,0,0,.18)] transition-all duration-[250ms] ease-out hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0 active:scale-[0.97]" href="/assignments/create">
            <Sparkles className="h-5 w-5" />
            <span>Create Assignment</span>
          </Link>
        </div>
        <nav className="mt-6 min-h-0 flex-1 space-y-2.5 overflow-hidden animate-fade-left">
          <NavItems />
        </nav>
        <div className="mt-auto shrink-0">
          <Link href="/settings" className="motion-press flex h-[50px] w-full cursor-pointer items-center gap-3.5 rounded-[20px] px-4 text-base font-medium leading-normal text-[#6B7280] transition-all duration-[250ms] hover:translate-x-1 hover:bg-[#F8F8F8] hover:text-[#111827] dark:text-[var(--muted)] dark:hover:bg-[var(--surface-subtle)] dark:hover:text-[var(--text)]">
            <Settings className="h-[22px] w-[22px] shrink-0" />
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
