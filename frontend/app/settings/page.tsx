'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AxiosError } from 'axios';
import { Camera, CheckCircle2, ImagePlus, LogOut, Mail, MapPin, Moon, Save, School, Sun, Trash2, UserRound } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { api } from '@/lib/api';
import { SettingsInput, settingsSchema } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';

type Theme = 'light' | 'dark';
type ToastState = { message: string; type: 'success' | 'error' };

const maxImageSize = 4 * 1024 * 1024;
const card = 'rounded-3xl border border-black/10 bg-white/82 p-5 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:p-6';
const panel = 'rounded-2xl border border-black/10 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:p-5';

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
  localStorage.setItem('darkMode', String(theme === 'dark'));
}

function settingsDefaults(user: ReturnType<typeof useAuthStore.getState>['user'], fallbackTheme: Theme = 'light'): SettingsInput {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    schoolName: user?.schoolName ?? '',
    city: user?.city ?? '',
    themePreference: user?.themePreference ?? fallbackTheme,
  };
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const updateUser = useAuthStore((s) => s.updateUser);
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settingsDefaults(user),
  });

  const theme = watch('themePreference');
  const isDark = theme === 'dark';
  const previewUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : ''), [photoFile]);
  const previewUser = { name: user?.name ?? 'Teacher', profileImage: previewUrl || user?.profileImage };

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    const browserTheme: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    reset(settingsDefaults(user, browserTheme));
  }, [reset, user]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const onPhotoDrop = (accepted: File[]) => {
    setPhotoError('');
    const file = accepted[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Upload a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > maxImageSize) {
      setPhotoError('Image must be 4MB or smaller.');
      return;
    }
    setPhotoFile(file);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: onPhotoDrop,
    noClick: true,
    noKeyboard: true,
    maxFiles: 1,
    multiple: false,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: maxImageSize,
    onDropRejected: () => setPhotoError('Upload a JPG, PNG, or WebP image up to 4MB.'),
  });

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setValue('themePreference', next, { shouldDirty: true });
    applyTheme(next);
  };

  const onSave = async (values: SettingsInput) => {
    try {
      const { data } = await api.patch('/api/auth/me', values);
      updateUser(data.user);
      applyTheme(data.user.themePreference ?? values.themePreference);
      reset(settingsDefaults(data.user, values.themePreference));
      setToast({ message: 'Profile changes saved.', type: 'success' });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setToast({ message: axiosError.response?.data?.message ?? 'Could not save settings.', type: 'error' });
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) {
      setPhotoError('Choose a profile image first.');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoError('');
    try {
      const formData = new FormData();
      formData.append('profileImage', photoFile);
      const { data } = await api.patch('/api/auth/me/profile-image', formData);
      updateUser(data.user);
      setPhotoFile(null);
      setToast({ message: 'Profile photo updated.', type: 'success' });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setToast({ message: axiosError.response?.data?.message ?? 'Could not update photo.', type: 'error' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post('/api/auth/logout');
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your VedaAI account permanently? This will remove your assignments and generated papers.');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await api.delete('/api/auth/me');
      clearAuth();
      router.push('/register');
    } catch {
      setToast({ message: 'Could not delete account.', type: 'error' });
      setIsDeleting(false);
    }
  };

  return (
    <AppShell breadcrumb="Settings">
      <Toast message={toast?.message ?? ''} type={toast?.type} />
      <form onSubmit={handleSubmit(onSave)} className="min-h-[calc(100vh-56px)] bg-[radial-gradient(circle_at_10%_8%,rgba(232,84,26,0.13),transparent_24rem),linear-gradient(135deg,#f8fafc,#ffffff_48%,#f1f5f9)] p-4 dark:bg-[radial-gradient(circle_at_10%_8%,rgba(255,122,61,0.12),transparent_24rem),linear-gradient(135deg,#020817,#0f172a_48%,#111827)] sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-6xl space-y-6">
          <motion.header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-300">Workspace</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Manage your identity, workspace details, and account controls.</p>
            </div>
            <Button type="submit" variant="primary" className="w-full sm:w-auto" loading={isSubmitting} disabled={!isDirty && !isSubmitting} leftIcon={<Save className="h-4 w-4" />}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </motion.header>

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <motion.section className={card} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white">Profile Photo</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Shown across your dashboard.</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>

              <div {...getRootProps()} className={`mt-6 rounded-3xl border border-dashed p-5 text-center transition-all ${isDragActive ? 'border-orange-400 bg-orange-500/10' : 'border-slate-300 bg-slate-50/80 dark:border-white/10 dark:bg-white/[0.03]'}`}>
                <input {...getInputProps()} />
                <div className="mx-auto flex justify-center">
                  <UserAvatar user={previewUser} size="xl" className="ring-4 ring-white dark:ring-slate-900" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">{photoFile ? photoFile.name : user?.name ?? 'Teacher'}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Drop a new image here or use the update button.</p>
                {photoError ? <p className="mt-3 text-xs font-semibold text-[var(--danger)]">{photoError}</p> : null}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button type="button" variant="outline" className="w-full" onClick={open} leftIcon={<ImagePlus className="h-4 w-4" />}>Choose Photo</Button>
                  <Button type="button" variant="primary" className="w-full" onClick={uploadPhoto} loading={isUploadingPhoto} leftIcon={<Camera className="h-4 w-4" />}>
                    {isUploadingPhoto ? 'Uploading...' : 'Update Photo'}
                  </Button>
                </div>
              </div>
            </motion.section>

            <motion.section className={card} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white">Profile Information</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Saved directly to MongoDB when you submit changes.</p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Input label="Full Name" leftIcon={<UserRound className="h-4 w-4" />} error={errors.name?.message} {...register('name')} />
                <Input label="Email" type="email" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
                <Input label="School Name" leftIcon={<School className="h-4 w-4" />} error={errors.schoolName?.message} {...register('schoolName')} />
                <Input label="City" leftIcon={<MapPin className="h-4 w-4" />} error={errors.city?.message} {...register('city')} />
              </div>
            </motion.section>
          </div>

          <motion.section className={card} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Preferences</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Personalize the interface for focused work.</p>
            </div>
            <div className={`mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${panel}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm dark:bg-slate-900">
                  {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Dark Mode</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{isDark ? 'Dark theme is on for reduced glare.' : 'Light theme is on for higher contrast.'}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={toggleTheme}
                className={`relative h-8 w-[58px] shrink-0 rounded-full p-1 transition-all duration-300 ease-in-out active:scale-[0.98] ${isDark ? 'bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-500/30' : 'bg-zinc-700 shadow-inner'}`}
              >
                <span className={`block h-6 w-6 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 ease-in-out ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </motion.section>

          <motion.section className={card} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Session controls and permanent account actions.</p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${panel}`}>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">Logout</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sign out from current session.</p>
                </div>
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShowLogoutConfirm(true)} leftIcon={<LogOut className="h-4 w-4" />}>Logout</Button>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-red-700 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="text-sm font-semibold">Delete Account</p>
                  <p className="mt-1 text-xs text-red-700/80 dark:text-red-200">Permanently delete your account and all data.</p>
                </div>
                <Button type="button" variant="danger" className="w-full sm:w-auto" onClick={handleDeleteAccount} loading={isDeleting} leftIcon={<Trash2 className="h-4 w-4" />}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </motion.section>
        </div>
      </form>

      {showLogoutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 text-center shadow-2xl shadow-black/20 dark:border-white/10 dark:bg-[#0B1120]">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Logout from VedaAI?</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You will need to sign in again to access your account.</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <Button type="button" variant="outline" onClick={() => setShowLogoutConfirm(false)}>Cancel</Button>
              <Button type="button" onClick={handleLogout} loading={isLoggingOut}>{isLoggingOut ? 'Logging out...' : 'Yes, Logout'}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
