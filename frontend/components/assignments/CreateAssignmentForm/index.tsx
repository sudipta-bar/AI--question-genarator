'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GenerationModal } from '@/components/generation/GenerationModal';
import { useAssignmentForm } from '@/hooks/useAssignmentForm';
import { useGenerationStore } from '@/store/generationStore';
import { AdditionalInfo } from './AdditionalInfo';
import { DueDatePicker } from './DueDatePicker';
import { FileUploadZone } from './FileUploadZone';
import { QuestionTypeRow } from './QuestionTypeRow';
import { StepIndicator } from './StepIndicator';

export function CreateAssignmentForm() {
  const { form, errors, submitting, submit } = useAssignmentForm();
  const generationStatus = useGenerationStore((state) => state.status);
  const isGenerating = generationStatus === 'queued' || generationStatus === 'processing';

  return (
    <>
      <section className="card mx-auto max-w-[1120px] p-5 sm:p-8">
        <StepIndicator />
        <div className="mb-6">
          <h1 className="text-xl font-bold"><span className="text-[var(--success)]">●</span> Create Assignment</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Set up a new assignment for your students</p>
        </div>
        <fieldset disabled={isGenerating || submitting} className="space-y-6 disabled:pointer-events-none disabled:opacity-60">
          <div>
            <h2 className="text-base font-bold">Assignment Details</h2>
            <p className="mt-1 text-[13px] text-[var(--muted)]">Basic information about your assignment</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Subject" value={form.subject} onChange={(e) => form.setSubject(e.target.value)} error={errors.subject} />
            <Input label="Class" value={form.className} onChange={(e) => form.setClassName(e.target.value)} error={errors.className} />
          </div>
          <FileUploadZone />
          <DueDatePicker error={errors.dueDate} />
          <div className="space-y-4">
            <div className="hidden grid-cols-[1fr_240px_240px_90px] items-center gap-5 px-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] lg:grid">
              <span>Question Type</span>
              <span className="text-center">No. of Questions</span>
              <span className="text-center">Marks</span>
              <span />
            </div>
            <div className="space-y-4">{form.questionTypes.map((row) => <QuestionTypeRow key={row.id} row={row} />)}</div>
            {errors.questionTypes ? <div className="mt-2 text-xs text-[var(--danger)]">{errors.questionTypes}</div> : null}
            <button type="button" onClick={form.addQuestionType} className="mt-4 inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-[var(--success)] hover:bg-[var(--surface-subtle)] active:scale-[0.98]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)] text-white">+</span>Add Question Type</button>
            <div className="flex justify-end gap-10 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-4 text-sm shadow-sm">
              <span className="text-[var(--muted)]">Total Questions <strong className="ml-2 text-base text-[var(--foreground)]">{form.totalQuestions()}</strong></span>
              <span className="text-[var(--muted)]">Total Marks <strong className="ml-2 text-base text-[var(--foreground)]">{form.totalMarks()}</strong></span>
            </div>
          </div>
          <AdditionalInfo />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline">← Previous</Button>
            <Button type="button" onClick={submit} loading={submitting}>{submitting ? 'Generating...' : 'Next →'}</Button>
          </div>
        </fieldset>
      </section>
      <GenerationModal onRetry={submit} />
    </>
  );
}
