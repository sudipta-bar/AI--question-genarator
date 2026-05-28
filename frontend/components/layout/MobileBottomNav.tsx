import Link from 'next/link';
import { memo } from 'react';

const mobileLinks = [
  { label: 'Home', href: '/home' },
  { label: 'Assignments', href: '/assignments' },
  { label: 'Library', href: '/library' },
  { label: 'Toolkit', href: '/toolkit' },
];

function MobileBottomNavComponent() {
  return (
    <>
      <nav className="mobile-only fixed bottom-0 left-0 right-0 z-30 grid h-16 grid-cols-4 border-t border-[var(--border)] bg-[var(--surface)]/95 text-center text-[11px] shadow-[var(--shadow-md)] backdrop-blur">
        {mobileLinks.map((item) => (
          <Link key={item.href} href={item.href} prefetch className={`flex flex-col items-center justify-center gap-1 active:scale-[0.97] ${item.label === 'Assignments' ? 'scale-105 font-semibold text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}>
            <span>o</span>{item.label}
          </Link>
        ))}
      </nav>
      <Link href="/assignments/create" prefetch className="btn-base btn-dark mobile-only fixed bottom-20 right-5 z-40 h-[52px] w-[52px] p-0 text-2xl">+</Link>
    </>
  );
}

export const MobileBottomNav = memo(MobileBottomNavComponent);
