import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Logo } from '@/components/Logo';

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo centered />
        <div className="h-7" />
        <h1 className="text-center text-3xl font-bold tracking-tight">Change your password</h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-[var(--muted)]">Confirm your current password and choose a stronger replacement.</p>
        <div className="h-8" />
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
