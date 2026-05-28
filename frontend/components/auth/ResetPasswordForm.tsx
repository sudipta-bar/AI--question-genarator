'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { api } from '@/lib/api';
import { ResetPasswordInput, resetPasswordSchema } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });
  const password = watch('password') ?? '';

  async function onSubmit(values: ResetPasswordInput) {
    setServerError('');
    try {
      const { data } = await api.post(`/api/auth/reset-password/${token}`, { password: values.password });
      setAuth(data.user, data.accessToken);
      router.push('/home');
    } catch {
      setServerError('Reset link is invalid or expired.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input label="New Password" type="password" leftIcon="*" error={errors.password?.message} {...register('password')} />
        <PasswordStrength password={password} />
      </div>
      <Input label="Confirm Password" type="password" leftIcon="*" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button className="w-full" loading={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Password'}</Button>
      {serverError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">{serverError}</div> : null}
      <p className="text-center text-sm text-[var(--muted)]"><Link className="font-semibold text-[var(--primary)]" href="/login">Back to sign in</Link></p>
    </form>
  );
}
