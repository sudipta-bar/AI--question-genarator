'use client';

import Link from 'next/link';
import { memo, useEffect, useMemo, useState } from 'react';
import { MoreHorizontal, Search, SlidersHorizontal } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/assignments/EmptyState';
import { api } from '@/lib/api';
import { Assignment } from '@/types';
import { Badge } from '@/components/ui/Badge';

const filterOptions: Array<{ label: string; value: 'all' | Assignment['status'] }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Queued', value: 'queued' },
  { label: 'Processing', value: 'processing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
];

const AssignmentCard = memo(function AssignmentCard({
  assignment,
  index,
  onDelete,
}: {
  assignment: Assignment;
  index: number;
  onDelete: (assignment: Assignment) => void;
}) {
  const dueDate = useMemo(
    () => (assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Not set'),
    [assignment.dueDate],
  );
  const assignedDate = useMemo(() => new Date(assignment.createdAt).toLocaleDateString(), [assignment.createdAt]);

  return (
    <article className="motion-surface motion-lift group relative min-w-0 cursor-pointer rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[color-mix(in_srgb,var(--primary)_42%,var(--border))] hover:shadow-[var(--shadow-md)] sm:p-6" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[var(--text)]">{assignment.subject}</h2>
          <p className="mt-1 truncate text-sm text-[var(--muted)]">{assignment.className} - {assignment.schoolName}</p>
        </div>
        <button type="button" aria-label="Assignment menu" className="motion-press peer flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <div className="invisible absolute right-5 top-14 z-20 w-44 origin-top-right translate-y-1 scale-95 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-1 opacity-0 shadow-[var(--shadow-md)] transition-all duration-150 peer-focus:visible peer-focus:translate-y-0 peer-focus:scale-100 peer-focus:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 hover:visible hover:translate-y-0 hover:scale-100 hover:opacity-100">
          <Link className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-soft)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)]" href={`/assignments/create/result/${assignment._id}`}>View Assignment</Link>
          <button type="button" onClick={() => onDelete(assignment)} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]">Delete</button>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Badge className="max-w-full bg-[var(--surface-subtle)] text-[var(--text-soft)]">{assignment.status}</Badge>
        {assignment.status === 'completed' ? (
          <Link className="text-sm font-medium text-orange-600" href={`/assignments/create/result/${assignment._id}`}>View Paper</Link>
        ) : null}
      </div>
      <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
        <div>Assigned on : {assignedDate}</div>
        <div>Due : {dueDate}</div>
      </div>
    </article>
  );
});

function AssignmentSkeleton() {
  return (
    <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-8 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-[20px] border border-[var(--border)] bg-[var(--surface)] p-6" />)}
    </div>
  );
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | Assignment['status']>('all');

  useEffect(() => {
    let cancelled = false;
    api.get('/api/assignments')
      .then(({ data }) => {
        if (!cancelled) setAssignments(data.assignments);
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const visibleAssignments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesSearch = !normalizedQuery || [
        assignment.subject,
        assignment.className,
        assignment.schoolName,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, query, statusFilter]);

  async function deleteAssignment(assignment: Assignment) {
    const confirmed = window.confirm(`Delete ${assignment.subject} assignment?`);
    if (!confirmed) return;

    setAssignments((current) => current.filter((item) => item._id !== assignment._id));
    try {
      await api.delete(`/api/assignments/${assignment._id}`);
    } catch {
      setAssignments((current) => [assignment, ...current]);
      window.alert('Could not delete assignment. Please try again.');
    }
  }

  return (
    <AppShell breadcrumb="Assignment">
      <div className="mx-auto max-w-7xl pb-10">
        {loading ? (
          <div className="pt-8"><AssignmentSkeleton /></div>
        ) : assignments.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="px-4 pb-4 pt-6 sm:px-8 sm:pt-8">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <h1 className="text-2xl font-semibold text-[var(--text)]">Assignments</h1>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">Manage assignments for your classes.</p>
            </div>

            <div className="mx-4 mb-6 flex flex-col gap-3 sm:mx-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <button type="button" onClick={() => setFilterOpen((open) => !open)} className="motion-press motion-halo flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm font-medium text-[var(--text-soft)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-subtle)] sm:w-auto" aria-expanded={filterOpen} aria-haspopup="menu">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>{statusFilter === 'all' ? 'Filter By' : filterOptions.find((option) => option.value === statusFilter)?.label}</span>
                </button>
                {filterOpen ? (
                  <div className="absolute left-0 top-12 z-20 w-full min-w-44 origin-top-left rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-1 shadow-[var(--shadow-md)] sm:w-48" role="menu">
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={statusFilter === option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setFilterOpen(false);
                        }}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-[var(--surface-subtle)] ${statusFilter === option.value ? 'text-[var(--primary)]' : 'text-[var(--text-soft)]'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="relative w-full sm:w-[320px] sm:max-w-[48vw]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="search"
                  aria-label="Search assignments"
                  placeholder="Search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] pl-11 pr-4 text-sm text-[var(--text)] shadow-[var(--shadow-sm)] outline-none transition-all duration-200 placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]"
                />
              </div>
            </div>

            {visibleAssignments.length === 0 ? (
              <div className="mx-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-12 text-center text-sm text-[var(--muted)] shadow-[var(--shadow-sm)] sm:mx-8">
                No assignments match your search or filter.
              </div>
            ) : (
              <div className="grid gap-4 px-4 sm:grid-cols-2 sm:px-8 xl:grid-cols-3">
                {visibleAssignments.map((assignment, index) => <AssignmentCard key={assignment._id} assignment={assignment} index={index} onDelete={deleteAssignment} />)}
              </div>
            )}
          </>
        )}

      </div>
    </AppShell>
  );
}
