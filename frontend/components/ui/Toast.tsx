'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
}

export function Toast({ message, type = 'success' }: ToastProps) {
  if (!message) return null;

  const Icon = type === 'success' ? CheckCircle2 : XCircle;

  return (
    <div className={`motion-surface fixed right-4 top-4 z-[70] flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-[var(--shadow-lg)] backdrop-blur-xl ${
      type === 'success'
        ? 'border-emerald-500/25 bg-[var(--surface-elevated)] text-emerald-700 dark:text-emerald-300'
        : 'border-red-500/25 bg-[var(--surface-elevated)] text-red-700 dark:text-red-300'
    }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
