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
    <div className="flex h-14 w-full items-center justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all duration-200 hover:border-[var(--primary)]/30 sm:h-[72px] lg:w-[220px]">
      <button
        type="button"
        className="flex h-full w-14 items-center justify-center text-xl font-medium text-[var(--muted)] transition-all duration-200 hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] active:scale-[0.96] sm:w-16"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        -
      </button>
      <span className="min-w-12 text-center text-base font-semibold tabular-nums text-[var(--text)]">{value}</span>
      <button
        type="button"
        className="flex h-full w-14 items-center justify-center text-xl font-medium text-[var(--muted)] transition-all duration-200 hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] active:scale-[0.96] sm:w-16"
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
    <div className="grid items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3 sm:gap-4 lg:grid-cols-[1fr_240px_240px_90px] lg:border-0 lg:bg-transparent lg:p-0">
      <div className="relative min-w-0">
        <select
          aria-label="Question Type"
          value={row.type}
          onChange={(e) => updateQuestionTypeField(row.id, 'type', e.target.value)}
          className="field h-14 w-full appearance-none rounded-2xl px-4 pr-12 text-sm font-semibold text-[var(--text)] shadow-sm transition-all duration-200 sm:h-[72px] sm:px-5"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)] transition-all duration-200"
        />
      </div>

      <div className="flex items-center justify-center">
        <Stepper value={row.count} max={50} onChange={(n) => updateQuestionTypeField(row.id, 'count', n)} />
      </div>

      <div className="flex items-center justify-center">
        <Stepper value={row.marks} max={100} onChange={(n) => updateQuestionTypeField(row.id, 'marks', n)} />
      </div>

      <div className="flex h-14 w-full items-center justify-center sm:h-[72px]">
        <button
          type="button"
          aria-label="Remove question type"
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 shadow-sm shadow-red-950/10 transition-all duration-200 hover:scale-[1.02] hover:border-red-400/30 hover:bg-red-500/20 hover:text-red-300 hover:shadow-red-500/10 active:scale-[0.97] sm:h-[60px] lg:w-[60px] lg:rounded-full"
          onClick={() => removeQuestionType(row.id)}
        >
          <Trash2 aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
