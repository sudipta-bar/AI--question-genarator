import Link from 'next/link';
import { Plus } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--bg)] px-4 py-20 text-center">
      <svg className="animate-scale-in motion-float-subtle h-[196px] w-[196px]" viewBox="0 0 188 188" fill="none" aria-hidden="true">
        <circle cx="36" cy="42" r="3" fill="#D4D4D4" />
        <path d="M137 35L140 42L147 45L140 48L137 55L134 48L127 45L134 42L137 35Z" fill="#D4D4D4" />
        <path d="M45 132L47 137L52 139L47 141L45 146L43 141L38 139L43 137L45 132Z" fill="#D4D4D4" />
        <circle cx="84" cy="84" r="76" fill="#E9E9E9" />
        <rect x="52" y="34" width="52" height="70" rx="8" fill="white" stroke="#CFCFCF" strokeWidth="2" />
        <path d="M64 56H92M64 70H92M64 84H80" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
        <circle cx="108" cy="108" r="18" fill="#F9FAFB" stroke="#111111" strokeWidth="5" />
        <path d="M121 121L136 136" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
        <circle cx="101" cy="103" r="13" fill="#FF5A36" />
        <path d="M96 98L106 108M106 98L96 108" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <h1 className="mt-8 animate-fade-up text-3xl font-bold tracking-tight text-[var(--text)] [animation-delay:100ms]">No assignments yet</h1>
      <p className="mt-3 max-w-[440px] animate-fade-up text-sm leading-6 text-[var(--muted)] [animation-delay:150ms]">Create your first assignment from the sidebar to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.</p>
      <Link href="/assignments/create" className="btn-base btn-dark mt-7 animate-fade-up [animation-delay:200ms]">
        <Plus className="h-4 w-4" />
        <span>Create Your First Assignment</span>
      </Link>
    </div>
  );
}
