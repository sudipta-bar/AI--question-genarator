'use client';

import Link from 'next/link';
import { memo, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { EmptyState } from '@/components/assignments/EmptyState';
import { api } from '@/lib/api';
import { Assignment } from '@/types';
import { Badge } from '@/components/ui/Badge';

const AssignmentCard = memo(function AssignmentCard({ assignment }: { assignment: Assignment }) {
  const dueDate = useMemo(
    () => (assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Not set'),
    [assignment.dueDate],
  );

  return (
    <article className="card min-w-0 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-5">
      <div className="min-w-0">
        <div className="truncate text-base font-bold">{assignment.subject}</div>
        <div className="mt-1 truncate text-sm text-[var(--muted)]">{assignment.className} - {assignment.schoolName}</div>
      </div>
      <div className="mt-3 text-sm">Due {dueDate}</div>
      <Badge className="mt-4 max-w-full bg-[var(--bg)] text-[var(--dark)]">{assignment.status}</Badge>
      {assignment.status === 'completed' ? (
        <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)]" href={`/assignments/create/result/${assignment._id}`}>View Paper</Link>
      ) : null}
    </article>
  );
});

function AssignmentSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="card h-36 animate-pulse p-4 sm:p-5" />)}
    </div>
  );
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <AppShell breadcrumb="Assignment">
      {loading ? (
        <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8"><AssignmentSkeleton /></div>
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => <AssignmentCard key={assignment._id} assignment={assignment} />)}
          </div>
        </div>
      )}
    </AppShell>
  );
}
