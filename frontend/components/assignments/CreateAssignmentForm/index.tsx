'use client';

import { GenerationModal } from '@/components/generation/GenerationModal';
import { Button } from '@/components/ui/Button';
import { useAssignmentForm } from '@/hooks/useAssignmentForm';
import { useGenerationStore } from '@/store/generationStore';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { AdditionalInfo } from './AdditionalInfo';
import { DueDatePicker } from './DueDatePicker';
import { FileUploadZone } from './FileUploadZone';
import { QuestionTypeRow } from './QuestionTypeRow';
import { StepIndicator } from './StepIndicator';

export function CreateAssignmentForm() {
  const { form, errors, submitting, submit } = useAssignmentForm();
  const generationStatus = useGenerationStore((state) => state.status);
  const isGenerating = generationStatus === 'queued' || generationStatus === 'processing';
  const totalQuestions = form.totalQuestions();
  const totalMarks = form.totalMarks();

  return (
    <>
      <div className="mx-auto w-[95%] max-w-[850px] animate-[fadeIn_300ms_ease-out]">
        <div className="mb-5">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[var(--text)]">Create Assignment</h1>
          <p className="mt-1 text-xs text-[var(--muted)]">Set up a new assignment for your students</p>
          <StepIndicator />
        </div>

        <section className="card animate-fade-up rounded-[24px] p-5 sm:p-8">
          <fieldset disabled={isGenerating || submitting} className="space-y-6 disabled:pointer-events-none disabled:opacity-60">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">Assignment Details</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">Basic information about your assignment</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--text-soft)]">Assignment Title <span className="text-[var(--primary)]">*</span></label>
                <input
                  aria-label="Assignment Title"
                  value={form.subject}
                  onChange={(e) => form.setSubject(e.target.value)}
                  placeholder="e.g. Chapter 5 - Forces and Motion"
                  className="field h-[42px] px-4 text-sm placeholder:text-[var(--muted)] placeholder:italic"
                />
                <span className="mt-1 block min-h-4 text-xs font-medium text-[var(--danger)]">{errors.subject ?? ''}</span>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--text-soft)]">Grade / Class <span className="text-[var(--primary)]">*</span></label>
                <input
                  aria-label="Grade / Class"
                  value={form.className}
                  onChange={(e) => form.setClassName(e.target.value)}
                  placeholder="Select grade"
                  className="field h-[42px] px-4 text-sm placeholder:text-[var(--muted)] placeholder:italic"
                />
                <span className="mt-1 block min-h-4 text-xs font-medium text-[var(--danger)]">{errors.className ?? ''}</span>
              </div>
            </div>

            <FileUploadZone />

            <DueDatePicker error={errors.dueDate} />

            <div className="space-y-3">
              <div className="hidden grid-cols-[1fr_160px_160px_42px] items-center gap-3 px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] lg:grid">
                <span>Question Type</span>
                <span className="text-center">Questions</span>
                <span className="text-center">Marks</span>
                <span />
              </div>
              <div className="space-y-3">{form.questionTypes.map((row) => <QuestionTypeRow key={row.id} row={row} />)}</div>
              {errors.questionTypes ? <div className="mt-2 text-xs text-[var(--danger)]">{errors.questionTypes}</div> : null}
              <button type="button" onClick={form.addQuestionType} className="motion-press mt-2 inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-[var(--text)] transition-all duration-[250ms] hover:text-[var(--primary)] active:scale-[0.96]"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text)]"><Plus className="h-3.5 w-3.5" /></span>Add question type</button>
              <div className="flex flex-col gap-2 pt-1 text-sm sm:flex-row sm:justify-end sm:gap-8">
                <span className="text-[var(--muted)]">Total Questions <strong key={totalQuestions} className="ml-2 inline-block animate-fade-up font-semibold text-[var(--text)]">{totalQuestions}</strong></span>
                <span className="text-[var(--muted)]">Total Marks <strong key={totalMarks} className="ml-2 inline-block animate-fade-up font-semibold text-[var(--text)]">{totalMarks}</strong></span>
              </div>
            </div>

            <AdditionalInfo />

            <div className="grid gap-3 pt-1 sm:flex sm:items-center sm:justify-between">
              <Button type="button" variant="outline" className="h-[42px] rounded-full px-6 text-sm shadow-none"><ArrowLeft className="h-4 w-4" /> Previous</Button>
              <Button type="button" className="h-[42px] rounded-full px-7 text-sm shadow-none" onClick={submit} loading={submitting}>{submitting ? 'Generating...' : <>Next <ArrowRight className="h-4 w-4" /></>}</Button>
            </div>
          </fieldset>
        </section>
      </div>
      <GenerationModal onRetry={submit} />
    </>
  );
}
