'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { LoginInput, loginSchema } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError('');
    try {
      const { data } = await api.post('/api/auth/login', values);
      setAuth(data.user, data.accessToken);
      router.replace('/assignments');
      router.refresh();
    } catch {
      setServerError('Invalid email or password');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Email address" type="email" leftIcon="@" error={errors.email?.message} className="transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" {...register('email')} />
      <div>
        <div className="mb-1 flex justify-end">
          <Link className="relative text-xs font-semibold text-[var(--primary)] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-orange-500 after:transition-all after:duration-200 hover:text-[var(--primary-hover)] hover:after:w-full" href="/forgot-password">Forgot password?</Link>
        </div>
        <Input label="Password" type={showPassword ? 'text' : 'password'} leftIcon="*" rightIcon={<button className="rounded px-1.5 py-0.5 text-xs hover:bg-[var(--surface-subtle)] active:scale-[0.96]" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button>} error={errors.password?.message} className="transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" {...register('password')} />
      </div>
      <Button className="w-full shadow-lg shadow-black/5 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]" loading={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign In'}</Button>
      {serverError ? <div className="rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-sm text-[#DC2626]">{serverError}</div> : null}
      <p className="text-center text-sm text-[var(--muted)]">Don&apos;t have an account? <Link className="relative font-semibold text-[var(--primary)] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-orange-500 after:transition-all after:duration-200 hover:after:w-full" href="/register">Sign up</Link></p>
    </form>
  );
}
