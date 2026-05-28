'use client';

import Link from 'next/link';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { downloadAssignmentPdf } from '@/lib/cloudPdf';
import { useGenerationStore } from '@/store/generationStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Assignment } from '@/types';

const statusClass: Record<Assignment['status'], string> = {
  draft: 'bg-[var(--bg)] text-[var(--muted)]',
  queued: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

function LibrarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="card h-56 animate-pulse p-5" />)}
    </div>
  );
}

const LibraryCard = memo(function LibraryCard({
  assignment,
  onDownload,
  onRegenerate,
  onDelete,
}: {
  assignment: Assignment;
  onDownload: (assignment: Assignment) => void;
  onRegenerate: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
}) {
  const generatedDate = useMemo(() => new Date(assignment.createdAt).toLocaleDateString(), [assignment.createdAt]);
  const canOpen = assignment.status === 'completed';

  return (
    <article className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">{assignment.subject} Question Paper</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{assignment.className} - {assignment.schoolName || 'School'}</p>
        </div>
        <Badge className={statusClass[assignment.status]}>{assignment.status}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-[var(--bg)] p-3">
          <p className="text-xs text-[var(--muted)]">Questions</p>
          <p className="mt-1 font-bold">{assignment.totalQuestions}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg)] p-3">
          <p className="text-xs text-[var(--muted)]">Total marks</p>
          <p className="mt-1 font-bold">{assignment.totalMarks}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--muted)]">Generated {generatedDate}</p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link aria-disabled={!canOpen} className={`btn-base h-10 px-3 ${canOpen ? 'btn-dark' : 'btn-disabled pointer-events-none bg-[var(--surface-subtle)] text-[var(--muted)]'}`} href={`/assignments/create/result/${assignment._id}`}>View</Link>
        <button type="button" disabled={!canOpen} onClick={() => onDownload(assignment)} className="btn-base btn-outline h-10 px-3">PDF</button>
        <button type="button" onClick={() => onRegenerate(assignment)} className="btn-base btn-outline h-10 px-3">Retry</button>
        <button type="button" onClick={() => onDelete(assignment)} className="btn-base btn-danger h-10 px-3">Delete</button>
      </div>
    </article>
  );
});

export default function LibraryPage() {
  const assignments = useLibraryStore((state) => state.assignments);
  const loading = useLibraryStore((state) => state.loading);
  const error = useLibraryStore((state) => state.error);
  const fetchAssignments = useLibraryStore((state) => state.fetchAssignments);
  const removeAssignment = useLibraryStore((state) => state.removeAssignment);
  const socket = useWebSocket();

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  useEffect(() => {
    assignments.filter((assignment) => assignment.status === 'queued' || assignment.status === 'processing')
      .forEach((assignment) => socket.subscribeToAssignment(assignment._id));
  }, [assignments, socket]);

  const handleDownload = useCallback(async (assignment: Assignment) => {
    try {
      await downloadAssignmentPdf(assignment._id, `${assignment.subject}-question-paper.pdf`);
    } catch (error) {
      console.error('Library PDF download failed:', error);
      window.alert('Could not download the PDF. Please try again.');
    }
  }, []);

  const handleRegenerate = useCallback(async (assignment: Assignment) => {
    const generation = useGenerationStore.getState();
    generation.reset();
    generation.setAssignmentId(assignment._id);
    generation.setStatus('queued');
    generation.setStage('queued');
    generation.setProgress(10, 'Setting up your assignment...');
    const { data } = await api.post(`/api/assignments/${assignment._id}/regenerate`);
    generation.setJobId(data.jobId);
    socket.subscribeToAssignment(assignment._id);
    useLibraryStore.getState().setAssignmentStatus(assignment._id, 'queued');
  }, [socket]);

  const handleDelete = useCallback(async (assignment: Assignment) => {
    const confirmed = window.confirm(`Delete ${assignment.subject} question paper?`);
    if (confirmed) await removeAssignment(assignment._id);
  }, [removeAssignment]);

  return (
    <AppShell breadcrumb="My Library">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 md:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Library</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Assignment history and generated question papers.</p>
          </div>
          <Link href="/assignments/create" className="btn-base btn-dark">Create Assignment</Link>
        </header>

        {loading ? <LibrarySkeleton /> : error ? (
          <div className="card p-8 text-center text-sm text-[var(--danger)]">{error}</div>
        ) : assignments.length === 0 ? (
          <div className="card flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--bg)] text-3xl">□</div>
            <h2 className="mt-6 text-lg font-bold">Library is empty</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">Generated question papers will appear here automatically after BullMQ completes an AI generation job.</p>
            <Link href="/assignments/create" className="btn-base btn-accent mt-6">Create your first paper</Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map((assignment) => (
              <LibraryCard key={assignment._id} assignment={assignment} onDownload={handleDownload} onRegenerate={handleRegenerate} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

    </AppShell>
  );
}
