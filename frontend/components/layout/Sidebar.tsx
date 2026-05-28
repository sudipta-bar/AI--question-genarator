'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { Logo } from '@/components/Logo';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/authStore';

const navLinks = [
  { label: 'Home', href: '/home' },
  { label: 'My Groups', href: '/groups' },
  { label: 'Assignments', href: '/assignments' },
  { label: "AI Teacher's Toolkit", href: '/toolkit' },
  { label: 'My Library', href: '/library' },
];

function SidebarComponent() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="sidebar desktop-only fixed left-0 top-0 flex h-screen w-[200px] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="p-6"><Logo /></div>
      <div className="px-4">
        <Link className="btn-base btn-dark w-full px-4" href="/assignments/create">
          + Create Assignment
        </Link>
      </div>
      <nav className="mt-6 flex-1 space-y-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`) || (pathname.includes('/result') && link.href === '/toolkit');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between border-l-[3px] px-5 py-3 text-sm active:scale-[0.99] ${isActive ? 'border-[var(--primary)] bg-[var(--surface-subtle)] font-semibold text-[var(--text)]' : 'border-transparent text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]'}`}
            >
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--border)] p-4">
        <Link href="/settings" className="mb-4 block rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] active:scale-[0.99]">
          Settings
        </Link>
        <div className="flex items-center gap-2">
          <UserAvatar user={user} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.name ?? 'Teacher'}</div>
            <div className="truncate text-xs text-[var(--muted)]">{user?.schoolName || 'School'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
