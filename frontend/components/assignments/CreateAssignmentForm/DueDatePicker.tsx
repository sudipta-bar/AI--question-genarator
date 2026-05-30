'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';

export function DueDatePicker({ error }: { error?: string }) {
  const { dueDate, setDueDate } = useAssignmentStore();
  return (
    <div className="block">
      <label id="due-date-label" className="mb-2 block text-xs font-semibold text-[var(--text-soft)]">Due Date <span className="text-[var(--primary)]">*</span></label>
      <div className="relative block">
        <DatePicker
          selected={dueDate ? new Date(dueDate) : null}
          onChange={(date: Date | null) => setDueDate(date ? date.toISOString() : '')}
          minDate={new Date()}
          placeholderText="Select date"
          dateFormat="dd-MM-yyyy"
          className="field h-[42px] w-full px-4 pr-10 text-sm placeholder:text-[var(--muted)] placeholder:italic"
          aria-labelledby="due-date-label"
        />
        <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
      </div>
      <span className="mt-1 block min-h-4 text-xs font-medium text-[var(--danger)]">{error ?? ''}</span>
    </div>
  );
}
