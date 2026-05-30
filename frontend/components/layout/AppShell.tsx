'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { appNavLinks } from './navigation';

function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const searchable = [
      ...appNavLinks,
      { label: 'Create Assignment', href: '/assignments/create' },
    ];

    if (!normalized) return searchable;
    return searchable.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query]);

  function goTo(href: string) {
    onClose();
    setQuery('');
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="mobile-only fixed inset-0 z-50 bg-black/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Search">
      <div className="mx-auto mt-14 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] p-3">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results[0]) goTo(results[0].href);
              if (event.key === 'Escape') onClose();
            }}
            placeholder="Search pages"
            className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(232,84,26,0.14)]"
          />
          <button type="button" aria-label="Close search" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-[var(--surface-subtle)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length ? results.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => goTo(item.href)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold hover:bg-[var(--surface-subtle)] active:scale-[0.99]"
            >
              <span>{item.label}</span>
              <span className="text-xs text-[var(--muted)]">{item.href}</span>
            </button>
          )) : (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">No matching pages found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ breadcrumb, children }: { breadcrumb: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function createRipple(event: MouseEvent) {
      const target = (event.target as Element | null)?.closest<HTMLElement>('a, button, .card, [role="button"]');
      if (!target || target.closest('[data-ripple="off"]')) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      target.classList.add('ripple-host');
      target.appendChild(ripple);
      window.setTimeout(() => ripple.remove(), 700);
    }

    document.addEventListener('click', createRipple, { capture: true });
    return () => document.removeEventListener('click', createRipple, { capture: true });
  }, []);

  return (
    <div className="h-dvh overflow-hidden bg-[#EFEFEF] text-[var(--text)]">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <TopBar breadcrumb={breadcrumb} onMenuClick={() => setDrawerOpen(true)} onSearchClick={() => setSearchOpen(true)} scrolled={scrolled} />
      <main
        className="mobile-content mt-24 h-[calc(100dvh-6rem)] min-w-0 overflow-y-auto overscroll-contain bg-[#EFEFEF] p-6 animate-[fadeIn_300ms_ease-out] md:ml-[372px]"
        onScroll={(event) => {
          const nextScrolled = event.currentTarget.scrollTop > 8;
          setScrolled((current) => (current === nextScrolled ? current : nextScrolled));
        }}
      >
        {children}
      </main>
      <MobileBottomNav pathname={pathname} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
