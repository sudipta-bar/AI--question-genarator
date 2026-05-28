'use client';

import { forwardRef, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, useId } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, leftIcon, rightIcon, error, hint, className = '', id, placeholder: _placeholder, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const labelOffset = leftIcon ? 'left-10' : 'left-3';

  return (
    <div className="block">
      <span className="relative block">
        {leftIcon ? <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]">{leftIcon}</span> : null}
        <input
          ref={ref}
          id={inputId}
          aria-label={label}
          aria-describedby={error || hint ? messageId : undefined}
          aria-invalid={Boolean(error)}
          {...props}
          placeholder=" "
          className={`field peer h-[54px] pb-2 pt-6 ${leftIcon ? 'pl-10' : 'pl-3'} ${rightIcon ? 'pr-16' : 'pr-3'} ${className}`}
        />
        {label ? (
          <label
            htmlFor={inputId}
            className={`pointer-events-none absolute ${labelOffset} top-2 z-10 origin-left rounded px-1 text-[11px] font-semibold text-[var(--muted)] transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:px-0 peer-placeholder-shown:text-[13px] peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:translate-y-0 peer-focus:px-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[var(--primary)]`}
          >
            {label}
          </label>
        ) : null}
        {rightIcon ? <span className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]">{rightIcon}</span> : null}
      </span>
      <span id={messageId} className={`mt-1 block min-h-4 text-xs font-medium ${error ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}>{error ?? hint ?? ''}</span>
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  rightIcon?: ReactNode;
  error?: string;
  hint?: string;
}

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function FloatingTextarea(
  { label, rightIcon, error, hint, className = '', id, placeholder: _placeholder, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const messageId = `${textareaId}-message`;

  return (
    <div className="block">
      <span className="relative block">
        <textarea
          ref={ref}
          id={textareaId}
          aria-label={label}
          aria-describedby={error || hint ? messageId : undefined}
          aria-invalid={Boolean(error)}
          {...props}
          placeholder=" "
          className={`field peer min-h-[112px] resize-y pb-3 pl-3 pt-7 ${rightIcon ? 'pr-12' : 'pr-3'} ${className}`}
        />
        {label ? (
          <label
            htmlFor={textareaId}
            className="pointer-events-none absolute left-3 top-2 z-10 origin-left rounded px-1 text-[11px] font-semibold text-[var(--muted)] transition-all duration-200 peer-placeholder-shown:top-5 peer-placeholder-shown:px-0 peer-placeholder-shown:text-[13px] peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:px-1 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[var(--primary)]"
          >
            {label}
          </label>
        ) : null}
        {rightIcon ? <span className="pointer-events-none absolute bottom-3 right-3 text-[var(--muted)]">{rightIcon}</span> : null}
      </span>
      <span id={messageId} className={`mt-1 block min-h-4 text-xs font-medium ${error ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}>{error ?? hint ?? ''}</span>
    </div>
  );
});

export const FloatingInput = Input;
