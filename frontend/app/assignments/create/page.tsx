import dynamic from 'next/dynamic';
import { CreateAssignmentPageReset } from '@/components/assignments/CreateAssignmentPageReset';
import { AppShell } from '@/components/layout/AppShell';

const CreateAssignmentForm = dynamic(() => import('@/components/assignments/CreateAssignmentForm').then((mod) => mod.CreateAssignmentForm), {
  loading: () => <div className="card mx-auto h-[520px] max-w-[720px] animate-pulse p-8" />,
});

export default function CreatePage() {
  return (
    <AppShell breadcrumb="← Assignment">
      <CreateAssignmentPageReset />
      <div className="p-4 md:p-8"><CreateAssignmentForm /></div>
    </AppShell>
  );
}
