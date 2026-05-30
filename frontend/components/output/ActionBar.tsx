'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadAssignmentPdf } from '@/lib/cloudPdf';
import { Button } from '@/components/ui/Button';

export function ActionBar({
  assignmentId,
  pdfUrl,
  pdfDownloadUrl,
  onPdfUploaded,
  onRegeneratePaper,
}: {
  assignmentId: string;
  pdfUrl?: string;
  pdfDownloadUrl?: string;
  onPdfUploaded?: (url: string, downloadUrl?: string) => void;
  onRegeneratePaper?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadState, setDownloadState] = useState<'idle' | 'preparing' | 'downloading' | 'regenerating' | 'error'>('idle');

  async function runPdfFlow(mode: 'download' | 'regenerate') {
    if (busy) return;
    setDownloadState(mode === 'regenerate' ? 'regenerating' : 'preparing');
    setDownloadError('');
    try {
      setBusy(true);
      const filename = 'question-paper.pdf'
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9.-]/g, '');

      if (mode === 'regenerate') await onRegeneratePaper?.();

      setDownloadState('downloading');
      await downloadAssignmentPdf(assignmentId, filename);
      setDownloadState('idle');
    } catch (error) {
      console.error('[ActionBar] PDF download failed:', error);
      const e: any = error;
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Could not prepare the PDF. Please try again.';
      setDownloadState('error');
      setDownloadError(msg);
      setTimeout(() => {
        setDownloadState('idle');
        setDownloadError('');
      }, 5000);
    } finally {
      setBusy(false);
    }
  }

  async function handlePdf() {
    await runPdfFlow('download');
  }

  async function handleRegeneratePdf() {
    await runPdfFlow('regenerate');
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-md)]">
      {downloadState === 'error' && downloadError ? <span className="self-center text-sm text-red-200">{downloadError}</span> : null}
      <Button variant="outline" className="rounded-full" onClick={handleRegeneratePdf} loading={downloadState === 'regenerating'} disabled={busy}>
        {downloadState === 'regenerating' ? 'Regenerating...' : 'Regenerate PDF'}
      </Button>
      <Button className="rounded-full" onClick={handlePdf} loading={downloadState === 'preparing' || downloadState === 'downloading'} disabled={busy} leftIcon={<Download className="h-4 w-4" />}>
        {downloadState === 'preparing' ? 'Preparing PDF...' : downloadState === 'downloading' ? 'Saving PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
