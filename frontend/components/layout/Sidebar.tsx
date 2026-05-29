'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { X } from 'lucide-react';
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
            className={`flex items-center gap-3 border-l-[3px] px-5 py-3 text-sm active:scale-[0.99] ${isActive ? 'border-[var(--primary)] bg-[var(--surface-subtle)] font-semibold text-[var(--text)]' : 'border-transparent text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]'}`}
          >
            <Icon className="mobile-only h-4 w-4 shrink-0" />
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
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-subtle)] p-3">
      <UserAvatar user={user} size="sm" />
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{user?.name ?? 'Teacher'}</div>
        <div className="truncate text-xs text-[var(--muted)]">{user?.schoolName || 'School'}</div>
      </div>
    </div>
  );
}

function SidebarComponent({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside className="sidebar desktop-only fixed left-0 top-0 flex h-screen w-[200px] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        <div className="p-6"><Logo /></div>
        <div className="px-4">
          <Link className="btn-base btn-dark w-full px-4" href="/assignments/create">
            + Create Assignment
          </Link>
        </div>
        <nav className="mt-6 flex-1 space-y-1">
          <NavItems />
        </nav>
        <div className="border-t border-[var(--border)] p-4">
          <Link href="/settings" className="mb-4 block rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] active:scale-[0.99]">
            Settings
          </Link>
          <ProfileBlock />
        </div>
      </aside>

      <div className={`mobile-only fixed inset-0 z-40 bg-black/45 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
      <aside className={`mobile-only fixed inset-y-0 left-0 z-50 flex w-[min(86vw,340px)] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <Logo />
          <button type="button" aria-label="Close menu" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--surface-subtle)] active:scale-[0.98]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-4">
          <Link onClick={onClose} className="btn-base btn-dark w-full px-4" href="/assignments/create">
            + Create Assignment
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto pb-4">
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
