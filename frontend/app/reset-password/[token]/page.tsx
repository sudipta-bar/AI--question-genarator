import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Logo } from '@/components/Logo';

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Logo centered />
        <div className="h-6" />
        <h1 className="text-center text-2xl font-bold">Create a new password</h1>
        <p className="mt-2 text-center text-sm leading-6 text-[var(--muted)]">Choose a strong password to secure your VedaAI account.</p>
        <div className="h-8" />
        <ResetPasswordForm token={params.token} />
      </section>
    </main>
  );
}
