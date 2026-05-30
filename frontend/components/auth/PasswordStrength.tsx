'use client';

import { useMemo } from 'react';

function getStrength(password: string) {
  if (!password) return { label: 'Enter a password', count: 0, color: 'var(--muted)' };
  if (password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)) return { label: 'Strong password', count: 4, color: '#22C55E' };
  if (password.length >= 8 && (/\d/.test(password) || /[^A-Za-z0-9]/.test(password))) return { label: 'Good password', count: 3, color: '#EAB308' };
  if (password.length >= 6) return { label: 'Fair password', count: 2, color: '#F97316' };
  return { label: 'Weak password', count: 1, color: 'var(--danger)' };
}

export function PasswordStrength({ password }: { password: string }) {
  const strength = useMemo(() => getStrength(password), [password]);
  return (
    <div aria-live="polite">
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300 ease-out" style={{ background: i <= strength.count ? strength.color : 'var(--border)' }} />
        ))}
      </div>
      <div className="mt-1 text-right text-xs font-medium" style={{ color: strength.color }}>{strength.label}</div>
    </div>
  );
}
