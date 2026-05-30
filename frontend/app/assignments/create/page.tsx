import dynamic from 'next/dynamic';
import { CreateAssignmentPageReset } from '@/components/assignments/CreateAssignmentPageReset';
import { AppShell } from '@/components/layout/AppShell';

const CreateAssignmentForm = dynamic(() => import('@/components/assignments/CreateAssignmentForm').then((mod) => mod.CreateAssignmentForm), {
  loading: () => <div className="mx-auto h-[520px] w-[95%] max-w-[850px] animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-sm)]" />,
});

export default function CreatePage() {
  return (
    <AppShell breadcrumb="Assignment">
      <CreateAssignmentPageReset />
      <div className="min-h-full bg-[var(--bg)] px-3 py-5 sm:px-5 md:px-8 md:py-7"><CreateAssignmentForm /></div>
    </AppShell>
  );
}
