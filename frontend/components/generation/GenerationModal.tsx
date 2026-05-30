'use client';

import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { playInterfaceSound } from '@/lib/interfaceAudio';
import { useAssignmentStore } from '@/store/assignmentStore';
import { GenerationStage, useGenerationStore } from '@/store/generationStore';

const steps: Array<{ stage: GenerationStage; label: string; floor: number }> = [
  { stage: 'queued', label: 'Queued', floor: 8 },
  { stage: 'preparing', label: 'Preparing prompt', floor: 22 },
  { stage: 'generating', label: 'Generating questions', floor: 48 },
  { stage: 'structuring', label: 'Structuring sections', floor: 68 },
  { stage: 'formatting', label: 'Formatting output', floor: 82 },
  { stage: 'saving', label: 'Saving assignment', floor: 92 },
  { stage: 'completed', label: 'Completed', floor: 100 },
];

function stageFromProgress(progress: number, stage: GenerationStage): GenerationStage {
  if (stage !== 'idle') return stage;
  if (progress >= 100) return 'completed';
  if (progress >= 80) return 'formatting';
  if (progress >= 60) return 'structuring';
  if (progress >= 35) return 'generating';
  if (progress >= 15) return 'preparing';
  return 'queued';
}

export function GenerationModal({ onRetry }: { onRetry?: () => void }) {
  const status = useGenerationStore((state) => state.status);
  const stage = useGenerationStore((state) => state.stage);
  const progress = useGenerationStore((state) => state.progress);
  const statusMessage = useGenerationStore((state) => state.statusMessage);
  const error = useGenerationStore((state) => state.error);
  const open = status === 'queued' || status === 'processing' || status === 'completed' || status === 'failed';
  const activeStage = stageFromProgress(progress, stage);
  const activeIndex = Math.max(0, steps.findIndex((step) => step.stage === activeStage));
  const safeProgress = Math.min(100, Math.max(0, progress || steps[activeIndex]?.floor || 0));
  const title = status === 'failed' ? 'Generation failed' : status === 'completed' ? 'Question paper ready' : 'Generating question paper';

  const message = useMemo(() => {
    if (status === 'failed') return error || 'Something went wrong while generating the paper.';
    if (status === 'completed') return 'Your structured exam paper has been saved.';
    return statusMessage || steps[activeIndex]?.label || 'Preparing generation...';
  }, [activeIndex, error, status, statusMessage]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  useEffect(() => {
    if (status !== 'completed') return;
    playInterfaceSound('success');
    const timer = window.setTimeout(() => {
      useGenerationStore.getState().reset();
      useAssignmentStore.getState().resetForm();
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'failed') playInterfaceSound('error');
  }, [status]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md animate-[fadeIn_180ms_ease-out]">
      <div role="dialog" aria-modal="true" aria-labelledby="generation-title" className="motion-surface w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-lg)] sm:p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${status === 'failed' ? 'bg-red-500/10 text-[var(--danger)]' : status === 'completed' ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-[var(--surface-subtle)] text-[var(--primary)]'}`}>
            {status === 'failed' ? (
              <span className="text-xl font-bold">!</span>
            ) : status === 'completed' ? (
              <span className="text-xl font-bold">✓</span>
            ) : (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="generation-title" className="text-lg font-bold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{message}</p>
          </div>
          <div className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-sm font-semibold">{Math.round(safeProgress)}%</div>
        </div>

        <div className="mt-6">
          <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-subtle)]">
            <div className="motion-progress h-full rounded-full bg-[var(--primary)] transition-all duration-500 ease-out" style={{ width: `${safeProgress}%` }} />
          </div>
          <div className="mt-5 space-y-3">
            {steps.map((step, index) => {
              const done = index < activeIndex || status === 'completed';
              const active = index === activeIndex && status !== 'completed' && status !== 'failed';
              return (
                <div key={step.stage} className="flex items-center gap-3 text-sm">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${done ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : active ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border)] text-[var(--muted)]'}`}>
                    {done ? '✓' : index + 1}
                  </span>
                  <span className={active ? 'font-semibold text-[var(--dark)]' : 'text-[var(--muted)]'}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {status === 'failed' ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => useGenerationStore.getState().reset()}>Close</Button>
            {onRetry ? <Button type="button" variant="primary" onClick={onRetry}>Try again</Button> : null}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
