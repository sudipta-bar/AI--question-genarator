export function Logo({ centered = false, large = false }: { centered?: boolean; large?: boolean }) {
  return (
    <div className={`flex items-center ${large ? 'gap-4' : 'gap-2'} ${centered ? 'justify-center' : ''}`}>
      <div className={`flex items-center justify-center bg-[var(--primary)] font-bold text-[var(--primary-contrast)] ${large ? 'h-9 w-9 rounded-xl text-lg' : 'h-8 w-8 rounded-lg text-lg'}`}>V</div>
      <span className={`font-bold text-[#111827] dark:text-[var(--text)] ${large ? 'text-[26px]' : 'text-lg'}`}>VedaAI</span>
    </div>
  );
}
