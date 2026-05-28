export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`pill inline-flex items-center border border-transparent px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}
