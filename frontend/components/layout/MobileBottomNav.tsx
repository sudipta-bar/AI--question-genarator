'use client';

import Link from 'next/link';
import { memo } from 'react';
import { mobileBottomLinks } from './navigation';

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileBottomNavComponent({ pathname }: { pathname: string }) {
  const dockLinks = mobileBottomLinks.filter((item) => item.href !== '/settings');

  return (
    <>
      <nav className="mobile-only fixed bottom-0 left-0 right-0 z-30 grid min-h-[72px] grid-cols-4 border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-elevated)_94%,transparent)] px-3 pb-[env(safe-area-inset-bottom)] text-center text-[10px] shadow-2xl shadow-black/20 backdrop-blur-xl">
        {dockLinks.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
          <Link key={item.href} href={item.href} prefetch className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 transition-all duration-200 active:scale-[0.94] ${active ? 'font-semibold text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]'}`}>
            <Icon className="h-5 w-5 shrink-0" />
            {active ? <span className="absolute right-4 top-2 h-2 w-2 rounded-full bg-[var(--primary)]" /> : null}
            <span className="max-w-full truncate">{item.label.replace("AI Teacher's ", '').replace('My ', '')}</span>
          </Link>
          );
        })}
      </nav>
    </>
  );
}

export const MobileBottomNav = memo(MobileBottomNavComponent);
