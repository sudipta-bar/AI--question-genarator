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
      <div className="space-y-8 p-4 sm:p-6 md:p-8">
        <header>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name || 'Teacher'}!</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Here is your VedaAI dashboard overview.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((card) => (
            <div key={card.label} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
              <p className="text-[13px] text-[var(--muted)]">{card.label}</p>
              <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-4 text-base font-semibold">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/assignments/create" className="btn-base btn-dark">+ Create Assignment</Link>
            <Link href="/library" className="btn-base btn-outline">My Library</Link>
            <Link href="/toolkit" className="btn-base btn-accent">AI Toolkit</Link>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-base font-semibold">Recent Assignments</h2>
          <div className="card flex min-h-40 items-center justify-center p-8 text-center text-sm text-[var(--muted)]">
            No assignments yet. Create your first one.
          </div>
        </section>
      </div>
    </AppShell>
  );
}
