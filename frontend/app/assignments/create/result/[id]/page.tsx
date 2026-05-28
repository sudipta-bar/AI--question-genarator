'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AxiosError } from 'axios';
import { AppShell } from '@/components/layout/AppShell';
import { GenerationModal } from '@/components/generation/GenerationModal';
import { ActionBar } from '@/components/output/ActionBar';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useGenerationStore } from '@/store/generationStore';
import { GeneratedPaper } from '@/types';

type PaperState = 'loading' | 'processing' | 'ready' | 'failed' | 'missing';

const QuestionPaper = dynamic(() => import('@/components/output/QuestionPaper').then((mod) => mod.QuestionPaper), {
  loading: () => <div className="question-paper-card card mx-auto h-[720px] max-w-[720px] animate-pulse p-6 md:p-10" />,
});

export default function ResultPage({ params }: { params: { id: string } }) {
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [state, setState] = useState<PaperState>('loading');
  const [message, setMessage] = useState('Loading paper...');
  const [pdfUrl, setPdfUrl] = useState<string | undefined>();
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | undefined>();
  const user = useAuthStore((s) => s.user);
  const generation = useGenerationStore();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function loadPaper() {
      try {
        const { data, status } = await api.get<{ paper?: GeneratedPaper; status?: string; message?: string; assignment?: { pdfUrl?: string; pdfDownloadUrl?: string } }>(`/api/assignments/${params.id}/paper`);
        if (cancelled) return;
        if (status === 202) {
          setState('processing');
          setMessage(data.message ?? 'Question paper is still being generated...');
          timer = setTimeout(loadPaper, 2000);
          return;
        }
        if (data.paper) {
          setPaper(data.paper);
          setPdfUrl(data.assignment?.pdfUrl);
          setPdfDownloadUrl(data.assignment?.pdfDownloadUrl);
          setState('ready');
          setMessage('');
        }
      } catch (error) {
        if (cancelled) return;
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.response?.status === 404) {
          setState('missing');
          setMessage('Question paper is not available yet. Please wait a moment and refresh, or regenerate the assignment.');
          return;
        }
        if (axiosError.response?.status === 409) {
          setState('failed');
          setMessage(axiosError.response.data?.message ?? 'Question paper generation failed.');
          return;
        }
        setState('failed');
        setMessage('Could not load the question paper. Please check the backend server and try again.');
      }
    }

    loadPaper();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [params.id, generation.status]);

  const showOverlay = (generation.status !== 'idle' && generation.status !== 'completed') || state === 'processing';

  return (
    <AppShell breadcrumb="← Create New">
      <div className="space-y-5 p-4 md:p-8">
        <div className="no-print flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] font-bold text-[var(--primary-contrast)]">V</div>
            <div className="rounded-lg bg-[var(--surface)] p-4 text-sm shadow">Certainly, {user?.name ?? 'Teacher'}! Here is your customized question paper.</div>
          </div>
          <ActionBar assignmentId={params.id} pdfUrl={pdfUrl} pdfDownloadUrl={pdfDownloadUrl} onPdfUploaded={(url, downloadUrl) => { setPdfUrl(url); setPdfDownloadUrl(downloadUrl); }} />
        </div>
        {paper ? (
          <QuestionPaper paper={paper} />
        ) : (
          <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-6 text-center text-sm text-[var(--muted)]">
            {message}
          </div>
        )}
      </div>
      {showOverlay ? <GenerationModal /> : null}
    </AppShell>
  );
}
