'use client';

import { ButtonHTMLAttributes } from 'react';

type Variant = 'dark' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({ variant = 'dark', loading, className = '', children, disabled, leftIcon, rightIcon, ...props }: Props) {
  const variants: Record<Variant, string> = {
    dark: 'btn-dark',
    primary: 'btn-accent',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  return (
    <button
      className={`btn-base transition-all duration-200 active:scale-[0.98] ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {!loading && leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      {children}
      {!loading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
}
