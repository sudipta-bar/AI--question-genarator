'use client';

import { useEffect, useState } from 'react';

export function StepIndicator() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500 ease-out" style={{ width: mounted ? '50%' : '0%' }} />
    </div>
  );
}
