'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/authStore';

const stats = [
  { label: 'Total Assignments', value: '0', color: 'text-[var(--primary)]' },
  { label: 'Papers Generated', value: '0', color: 'text-[var(--success)]' },
  { label: 'Total Students', value: '0', color: 'text-blue-500 dark:text-blue-300' },
];

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  return (
    <AppShell breadcrumb="Home">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-5 md:p-6">
        <header>
          <h1 className="text-[46px] font-bold leading-[1.05] tracking-tight text-[#1E1E1E] dark:text-[var(--text)]">Welcome back, {user?.name || 'Teacher'}!</h1>
          <p className="mt-3 text-[18px] font-normal text-[#6B7280] dark:text-[var(--muted)]">Here is your VedaAI dashboard overview.</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((card) => (
            <div key={card.label} className="card motion-lift home-stat-card min-w-0">
              <p className="text-lg font-medium text-[var(--muted)]">{card.label}</p>
              <p className={`mt-2 text-[44px] font-bold leading-none ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-[30px] font-bold">Quick Actions</h2>
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Link href="/library" className="btn-base btn-outline w-full sm:w-auto">My Library</Link>
            <Link href="/toolkit" className="btn-base btn-accent w-full sm:w-auto">AI Toolkit</Link>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[30px] font-bold">Recent Assignments</h2>
          <div className="card motion-lift flex min-h-40 items-center justify-center p-8 text-center text-sm text-[var(--muted)]">
            No assignments yet. Create your first one.
          </div>
        </section>
      </div>
    </AppShell>
  );
}
