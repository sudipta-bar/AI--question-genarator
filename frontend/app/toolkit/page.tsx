'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';

const tools = [
  {
    title: 'Question Paper Generator',
    description: 'Generate AI-powered question papers instantly',
    color: 'bg-[var(--primary)]',
    href: '/assignments/create',
    available: true,
  },
  {
    title: 'Rubric Builder',
    description: 'Create marking rubrics for assignments',
    color: 'bg-blue-500',
    href: '#',
    available: false,
  },
  {
    title: 'Answer Key Generator',
    description: 'Auto-generate answer keys for your papers',
    color: 'bg-[var(--success)]',
    href: '#',
    available: false,
  },
  {
    title: 'Grade Analyzer',
    description: 'Analyze student performance with AI insights',
    color: 'bg-violet-500',
    href: '#',
    available: false,
  },
];

export default function ToolkitPage() {
  return (
    <AppShell breadcrumb="AI Toolkit">
      <div className="space-y-8 p-4 sm:p-6 md:p-8">
        <header>
          <h1 className="text-2xl font-bold">AI Teacher&apos;s Toolkit</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Powerful AI tools to make teaching easier.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <article key={tool.title} className={`card relative p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${tool.available ? '' : 'opacity-75'}`}>
              {!tool.available ? (
                <span className="pill absolute right-3 top-3 bg-[var(--surface-subtle)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">Coming Soon</span>
              ) : null}
              <div className={`h-9 w-9 rounded-lg ${tool.color} shadow-[var(--shadow-sm)]`} />
              <h3 className="mt-4 text-base font-semibold">{tool.title}</h3>
              <p className="mt-2 text-[13px] leading-5 text-[var(--muted)]">{tool.description}</p>
              {tool.available ? (
                <Link href={tool.href} className="mt-5 inline-flex text-[13px] font-semibold text-[var(--primary)] hover:underline active:scale-[0.99]">Open Tool →</Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
