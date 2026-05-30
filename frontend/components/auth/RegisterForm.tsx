'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AxiosError } from 'axios';
import { Camera, Check, ImagePlus, Mail, MapPin, School, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { RegisterInput, registerSchema } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

const maxImageSize = 4 * 1024 * 1024;

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const [imageError, setImageError] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [visible, setVisible] = useState({ password: false, confirm: false });
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const watchedPassword = watch('password') ?? '';
  const previewUrl = useMemo(() => (profileImage ? URL.createObjectURL(profileImage) : ''), [profileImage]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const onDrop = (accepted: File[]) => {
    setImageError('');
    const file = accepted[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > maxImageSize) {
      setImageError('Image must be 4MB or smaller.');
      return;
    }
    setProfileImage(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: maxImageSize,
    onDropRejected: () => setImageError('Upload a JPG, PNG, or WebP image up to 4MB.'),
  });

  async function onSubmit(values: RegisterInput) {
    setServerError('');
    try {
      const { confirmPassword: _confirmPassword, ...payload } = values;
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (profileImage) formData.append('profileImage', profileImage);

      const { data } = await api.post('/api/auth/register', formData);
      setAuth(data.user, data.accessToken);
      router.push('/assignments');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; issues?: { message?: string }[] }>;
      setServerError(axiosError.response?.data?.message ?? axiosError.response?.data?.issues?.[0]?.message ?? 'Unable to create account. Please try again.');
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer overflow-hidden rounded-3xl border border-dashed p-4 transition-all duration-200 hover:scale-[1.02] hover:border-orange-400 ${
          isDragActive
            ? 'border-orange-400 bg-orange-500/10 shadow-lg shadow-orange-500/10'
            : 'border-white/40 bg-white/55 hover:border-orange-300 hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.04]'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-zinc-950 via-zinc-800 to-orange-500 shadow-lg">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white">
                <Camera className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              <ImagePlus className="h-4 w-4 text-orange-500" />
              {profileImage ? profileImage.name : 'Upload profile photo'}
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Drag and drop an image, or click to browse. JPG, PNG, WebP up to 4MB.</p>
          </div>
          {profileImage ? <Check className="hidden h-5 w-5 text-emerald-500 sm:block" /> : null}
        </div>
      </div>
      {imageError ? <p className="-mt-2 text-xs font-semibold text-[var(--danger)]">{imageError}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full Name" leftIcon={<UserRound className="h-4 w-4" />} error={errors.name?.message} className="animate-fade-up transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" style={{ animationDelay: '0ms' }} {...register('name')} />
        <Input label="Email address" type="email" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} className="animate-fade-up transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" style={{ animationDelay: '40ms' }} {...register('email')} />
      </div>
      <div>
        <Input
          label="Password"
          type={visible.password ? 'text' : 'password'}
          leftIcon="*"
          error={errors.password?.message}
          className="animate-fade-up transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
          style={{ animationDelay: '80ms' }}
          rightIcon={<button className="rounded px-1.5 py-0.5 text-xs hover:bg-[var(--surface-subtle)] active:scale-[0.96]" type="button" onClick={() => setVisible((state) => ({ ...state, password: !state.password }))}>{visible.password ? 'Hide' : 'Show'}</button>}
          {...register('password')}
        />
        <PasswordStrength password={watchedPassword} />
      </div>
      <Input
        label="Confirm Password"
        type={visible.confirm ? 'text' : 'password'}
        leftIcon="*"
        error={errors.confirmPassword?.message}
        className="animate-fade-up transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
        style={{ animationDelay: '120ms' }}
        rightIcon={<button className="rounded px-1.5 py-0.5 text-xs hover:bg-[var(--surface-subtle)] active:scale-[0.96]" type="button" onClick={() => setVisible((state) => ({ ...state, confirm: !state.confirm }))}>{visible.confirm ? 'Hide' : 'Show'}</button>}
        {...register('confirmPassword')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="School Name" leftIcon={<School className="h-4 w-4" />} error={errors.schoolName?.message} className="animate-fade-up transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" style={{ animationDelay: '160ms' }} {...register('schoolName')} />
        <Input label="City" leftIcon={<MapPin className="h-4 w-4" />} error={errors.city?.message} className="animate-fade-up transition-shadow duration-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" style={{ animationDelay: '200ms' }} {...register('city')} />
      </div>
      <Button variant="primary" className="w-full shadow-lg shadow-orange-500/10 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]" loading={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Create Account'}</Button>
      {serverError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{serverError}</div> : null}
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">Already have an account? <Link className="font-semibold text-orange-600 dark:text-orange-300" href="/login">Sign in</Link></p>
    </motion.form>
  );
}
