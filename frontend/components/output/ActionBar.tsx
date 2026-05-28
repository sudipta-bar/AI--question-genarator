'use client';

import { useState } from 'react';
import { downloadAssignmentPdf, regenerateCloudinaryPdf } from '@/lib/cloudPdf';
import { Button } from '@/components/ui/Button';

export function ActionBar({
  assignmentId,
  pdfUrl,
  pdfDownloadUrl,
  onPdfUploaded,
}: {
  assignmentId: string;
  pdfUrl?: string;
  pdfDownloadUrl?: string;
  onPdfUploaded?: (url: string, downloadUrl?: string) => void;
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

      if (mode === 'regenerate') {
        const data = await regenerateCloudinaryPdf(assignmentId);
        const url = data.url || data.pdfUrl;
        if (url) onPdfUploaded?.(url, url);
      }

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
    <div className="no-print flex flex-wrap items-center justify-end gap-3">
      {downloadState === 'error' && downloadError ? <span className="self-center text-sm text-[var(--danger)]">{downloadError}</span> : null}
      <Button variant="outline" onClick={handleRegeneratePdf} disabled={busy}>Regenerate PDF</Button>
      <Button onClick={handlePdf} loading={busy}>
        {downloadState === 'preparing' ? 'Preparing PDF...' : downloadState === 'downloading' ? 'Saving PDF...' : downloadState === 'regenerating' ? 'Regenerating PDF...' : 'Download PDF'}
      </Button>
    </div>
  );
}
