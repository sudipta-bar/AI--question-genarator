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
    <div className="card p-5">
      <div className="font-bold">{assignment.subject}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{assignment.className} - {assignment.schoolName}</div>
      <div className="mt-3 text-sm">Due {dueDate}</div>
      <Badge className="mt-4 bg-[var(--bg)] text-[var(--dark)]">{assignment.status}</Badge>
      {assignment.status === 'completed' ? (
        <Link className="mt-4 block text-sm font-semibold text-[var(--primary)]" href={`/assignments/create/result/${assignment._id}`}>View Paper</Link>
      ) : null}
    </div>
  );
});

function AssignmentSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="card h-36 animate-pulse p-5" />)}
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
        <div className="p-4 sm:p-6"><AssignmentSkeleton /></div>
      ) : assignments.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => <AssignmentCard key={assignment._id} assignment={assignment} />)}
          </div>
        </div>
      )}
    </AppShell>
  );
}
