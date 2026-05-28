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
    <div className="flex h-[72px] w-full items-center justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all duration-200 hover:border-[var(--primary)]/30 lg:w-[220px]">
      <button
        type="button"
        className="flex h-full w-16 items-center justify-center text-xl font-medium text-[var(--muted)] transition-all duration-200 hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] active:scale-[0.96]"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        -
      </button>
      <span className="min-w-12 text-center text-base font-semibold tabular-nums text-[var(--foreground)]">{value}</span>
      <button
        type="button"
        className="flex h-full w-16 items-center justify-center text-xl font-medium text-[var(--muted)] transition-all duration-200 hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] active:scale-[0.96]"
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
    <div className="grid items-center gap-5 lg:grid-cols-[1fr_240px_240px_90px]">
      <div className="relative min-w-0">
        <select
          aria-label="Question Type"
          value={row.type}
          onChange={(e) => updateQuestionTypeField(row.id, 'type', e.target.value)}
          className="field h-[72px] w-full appearance-none rounded-2xl px-5 pr-12 text-sm font-semibold text-[var(--foreground)] shadow-sm transition-all duration-200"
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

      <div className="flex h-[72px] w-full items-center justify-center">
        <button
          type="button"
          aria-label="Remove question type"
          className="flex h-[60px] w-[60px] items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400 shadow-sm shadow-red-950/10 transition-all duration-200 hover:scale-105 hover:border-red-400/30 hover:bg-red-500/20 hover:text-red-300 hover:shadow-red-500/10 active:scale-[0.97]"
          onClick={() => removeQuestionType(row.id)}
        >
          <Trash2 aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
