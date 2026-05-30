import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  return (
    <main className="auth-page bg-[length:200%_200%] animate-gradient-shift">
      <section className="auth-card animate-fade-up">
        <Logo centered />
        <div className="h-7" />
        <h1 className="text-center text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mx-auto mt-2 max-w-xs text-center text-sm leading-6 text-[var(--muted)]">Sign in to manage assignments, generated papers, and your teaching workspace.</p>
        <div className="h-8" />
        <LoginForm />
      </section>
    </main>
  );
}
