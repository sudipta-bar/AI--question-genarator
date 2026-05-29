'use client';

import Link from 'next/link';
import { memo } from 'react';
import { mobileBottomLinks } from './navigation';

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MobileBottomNavComponent({ pathname }: { pathname: string }) {
  return (
    <>
      <nav className="mobile-only fixed bottom-0 left-0 right-0 z-30 grid min-h-[64px] grid-cols-5 border-t border-[var(--border)] bg-[var(--surface)]/95 pb-[env(safe-area-inset-bottom)] text-center text-[10px] shadow-[var(--shadow-md)] backdrop-blur">
        {mobileBottomLinks.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
          <Link key={item.href} href={item.href} prefetch className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 active:scale-[0.97] ${active ? 'font-semibold text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate">{item.label.replace("AI Teacher's ", '').replace('My ', '')}</span>
          </Link>
          );
        })}
      </nav>
      <Link href="/assignments/create" prefetch className="btn-base btn-dark mobile-only fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-5 z-40 h-[52px] w-[52px] p-0 text-2xl shadow-[var(--shadow-md)]">+</Link>
    </>
  );
}

export const MobileBottomNav = memo(MobileBottomNavComponent);
