'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAssignmentStore } from '@/store/assignmentStore';

export function DueDatePicker({ error }: { error?: string }) {
  const { dueDate, setDueDate } = useAssignmentStore();
  return (
    <div className="block">
      <div className="relative block">
        <DatePicker
          selected={dueDate ? new Date(dueDate) : null}
          onChange={(date: Date | null) => setDueDate(date ? date.toISOString() : '')}
          minDate={new Date()}
          placeholderText=" "
          dateFormat="dd-MM-yyyy"
          className="field peer h-[52px] w-full pb-1 pl-3 pr-10 pt-5"
          aria-labelledby="due-date-label"
        />
        <label
          id="due-date-label"
          className="pointer-events-none absolute left-3 top-1.5 z-10 origin-left translate-y-0 text-[11px] font-semibold text-[var(--muted)] transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[13px] peer-placeholder-shown:font-medium peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[var(--primary)]"
        >
          Due Date
        </label>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">□</span>
      </div>
      <span className="mt-1 block min-h-4 text-xs font-medium text-[var(--danger)]">{error ?? ''}</span>
    </div>
  );
}
