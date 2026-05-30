'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { api } from '@/lib/api';
import { ChangePasswordInput, changePasswordSchema } from '@/lib/validators';

function VisibilityToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-md px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text)] active:scale-[0.98]"
      onClick={onClick}
    >
      {visible ? 'Hide' : 'Show'}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), mode: 'onTouched' });
  const newPassword = watch('newPassword') ?? '';
  const passwordType = useMemo(() => ({
    current: visible.current ? 'text' : 'password',
    next: visible.next ? 'text' : 'password',
    confirm: visible.confirm ? 'text' : 'password',
  }), [visible]);

  async function onSubmit(values: ChangePasswordInput) {
    setMessage('');
    setError('');
    try {
      const { confirmNewPassword: _confirmNewPassword, ...payload } = values;
      const { data } = await api.post<{ message: string }>('/api/auth/change-password', payload);
      setMessage(data.message);
      reset();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; issues?: { message?: string }[] }>;
      setError(axiosError.response?.data?.message ?? axiosError.response?.data?.issues?.[0]?.message ?? 'Could not change password. Please check your details and try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Email address" type="email" leftIcon="@" autoComplete="email" error={errors.email?.message} className="transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" {...register('email')} />
      <Input
        label="Current password"
        type={passwordType.current}
        leftIcon="*"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        className="transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
        rightIcon={<VisibilityToggle visible={visible.current} onClick={() => setVisible((state) => ({ ...state, current: !state.current }))} />}
        {...register('currentPassword')}
      />
      <div>
        <Input
          label="New password"
          type={passwordType.next}
          leftIcon="*"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          className="transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          rightIcon={<VisibilityToggle visible={visible.next} onClick={() => setVisible((state) => ({ ...state, next: !state.next }))} />}
          {...register('newPassword')}
        />
        <PasswordStrength password={newPassword} />
      </div>
      <Input
        label="Confirm new password"
        type={passwordType.confirm}
        leftIcon="*"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        className="transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
        rightIcon={<VisibilityToggle visible={visible.confirm} onClick={() => setVisible((state) => ({ ...state, confirm: !state.confirm }))} />}
        {...register('confirmNewPassword')}
      />
      <Button className="w-full transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]" loading={isSubmitting}>{isSubmitting ? 'Changing password...' : 'Change Password'}</Button>
      {message ? <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/70 dark:bg-green-950/40 dark:text-green-200">{message}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">{error}</div> : null}
      <p className="text-center text-sm text-[var(--muted)]"><Link className="relative font-semibold text-[var(--primary)] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-orange-500 after:transition-all after:duration-200 hover:after:w-full" href="/login">Back to sign in</Link></p>
    </form>
  );
}
