export default function Loading() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="h-7 w-48 animate-pulse rounded-md bg-[var(--border)]" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-[var(--border)]" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="card h-36 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
