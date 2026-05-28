import { Logo } from '@/components/Logo';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_12%,rgba(232,84,26,0.18),transparent_30rem),radial-gradient(circle_at_88%_4%,rgba(14,165,233,0.16),transparent_26rem),linear-gradient(135deg,#f8fafc,#fff7ed_52%,#eef2ff)] px-4 py-8 dark:bg-[radial-gradient(circle_at_12%_12%,rgba(255,122,61,0.16),transparent_30rem),radial-gradient(circle_at_88%_4%,rgba(56,189,248,0.10),transparent_26rem),linear-gradient(135deg,#020817,#0f172a_52%,#111827)]">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden lg:block">
          <Logo />
          <h1 className="mt-10 max-w-md text-5xl font-bold leading-tight tracking-tight text-slate-950 dark:text-white">Create polished papers with your teacher profile built in.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">Your photo and school details travel with your workspace, so VedaAI feels personal from the first login.</p>
        </div>
        <div className="rounded-[2rem] border border-white/55 bg-white/72 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/55 sm:p-8">
          <Logo centered />
          <div className="h-7" />
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Create your account</h1>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-600 dark:text-slate-300">Upload a profile photo now, or use the default avatar and update it later in settings.</p>
          <div className="h-7" />
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
