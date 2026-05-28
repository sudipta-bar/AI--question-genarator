import Link from 'next/link';

export function EmptyState() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-4 text-center">
      <svg width="150" height="150" viewBox="0 0 150 150" fill="none"><circle cx="75" cy="75" r="70" fill="#EBEBEB"/><rect x="47" y="36" width="48" height="64" rx="6" fill="white" stroke="#D1D5DB"/><path d="M58 55H84M58 68H84M58 81H75" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round"/><circle cx="96" cy="96" r="16" stroke="#1A1A1A" strokeWidth="5"/><path d="M107 107L120 120" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round"/><path d="M88 88L104 104M104 88L88 104" stroke="#EF4444" strokeWidth="4" strokeLinecap="round"/></svg>
      <h1 className="mt-6 text-xl font-semibold">No assignments yet</h1>
      <p className="mt-3 max-w-[380px] text-sm leading-6 text-[var(--muted)]">Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.</p>
      <Link href="/assignments/create" className="btn-base btn-dark mt-6">+ Create Your First Assignment</Link>
    </div>
  );
}
