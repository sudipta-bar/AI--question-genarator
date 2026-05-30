export function StudentInfoSection({ className }: { className: string }) {
  return <div className="mt-5 grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-[13px] text-[var(--text)] sm:grid-cols-2"><div>Name: _________________________________</div><div>Roll Number: _______________</div><div>Class: {className} &nbsp; Section: ___________</div></div>;
}
