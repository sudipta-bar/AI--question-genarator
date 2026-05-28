'use client';

import { SelectHTMLAttributes, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Select({ label, error, hint, className = '', id, children, ...props }: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = `${selectId}-message`;

  if (!label) {
    return (
      <span className="relative block">
        <select {...props} className={`field h-10 appearance-none px-3 pr-10 ${className}`}>
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] transition-transform duration-200"
        />
      </span>
    );
  }

  return (
    <div className="block">
      <span className="relative block">
        <select
          id={selectId}
          aria-label={label}
          aria-describedby={error || hint ? messageId : undefined}
          aria-invalid={Boolean(error)}
          {...props}
          className={`field peer h-[52px] appearance-none pb-1 pl-3 pr-11 pt-5 transition-all duration-200 ${className}`}
        >
          {children}
        </select>
        <label
          htmlFor={selectId}
          className="pointer-events-none absolute left-3 top-1.5 z-10 text-[11px] font-semibold text-[var(--muted)] transition-all duration-200 peer-focus:text-[var(--primary)]"
        >
          {label}
        </label>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] transition-all duration-200 ease-out peer-focus:rotate-180 peer-focus:text-[var(--primary)]"
        />
      </span>
      <span id={messageId} className={`mt-1 block min-h-4 text-xs font-medium ${error ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}>
        {error ?? hint ?? ''}
      </span>
    </div>
  );
}

export const FloatingSelect = Select;
