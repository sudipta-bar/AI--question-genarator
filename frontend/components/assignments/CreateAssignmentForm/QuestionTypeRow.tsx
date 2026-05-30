'use client';

import { ChevronDown, Trash2 } from 'lucide-react';
import { QuestionTypeRow as Row } from '@/types';
import { useAssignmentStore } from '@/store/assignmentStore';

const options = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'True/False',
  'Fill in the Blanks',
];

function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex h-[42px] w-full items-center justify-between overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] transition-all duration-200 hover:border-[var(--primary)] lg:w-[160px]">
      <button
        type="button"
        className="flex h-full w-10 items-center justify-center text-lg font-medium text-[var(--muted)] transition-all duration-100 hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] active:scale-[0.96]"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        -
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums text-[var(--text)]">{value}</span>
      <button
        type="button"
        className="flex h-full w-10 items-center justify-center text-lg font-medium text-[var(--muted)] transition-all duration-100 hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] active:scale-[0.96]"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  );
}

export function QuestionTypeRow({ row }: { row: Row }) {
  const { updateQuestionTypeField, removeQuestionType } = useAssignmentStore();

  return (
    <div className="motion-lift grid animate-fade-up items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 transition-all duration-[250ms] hover:border-[color-mix(in_srgb,var(--primary)_32%,var(--border))] sm:gap-3 lg:grid-cols-[1fr_160px_160px_42px]">
      <div className="relative min-w-0">
        <select
          aria-label="Question Type"
          value={row.type}
          onChange={(e) => updateQuestionTypeField(row.id, 'type', e.target.value)}
          className="field h-[42px] w-full appearance-none rounded-xl px-4 pr-10 text-sm font-medium"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] transition-all duration-200"
        />
      </div>

      <div className="flex items-center justify-center">
        <Stepper value={row.count} max={50} onChange={(n) => updateQuestionTypeField(row.id, 'count', n)} />
      </div>

      <div className="flex items-center justify-center">
        <Stepper value={row.marks} max={100} onChange={(n) => updateQuestionTypeField(row.id, 'marks', n)} />
      </div>

      <div className="flex h-[42px] w-full items-center justify-center">
        <button
          type="button"
          aria-label="Remove question type"
          className="flex h-[42px] w-full items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)] transition-transform duration-150 hover:scale-105 hover:bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] active:scale-[0.96] lg:w-[42px] lg:rounded-full"
          onClick={() => removeQuestionType(row.id)}
        >
          <Trash2 aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
