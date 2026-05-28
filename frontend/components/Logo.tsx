export function Logo({ centered = false }: { centered?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${centered ? 'justify-center' : ''}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-lg font-bold text-[var(--primary-contrast)]">V</div>
      <span className="text-lg font-bold text-[var(--dark)]">VedaAI</span>
    </div>
  );
}
