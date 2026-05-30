'use client';

import { useAssignmentStore } from '@/store/assignmentStore';

export function AdditionalInfo() {
  const { additionalInfo, setAdditionalInfo } = useAssignmentStore();
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[var(--text-soft)]">Additional Information</label>
      <textarea
        aria-label="Additional Information"
        value={additionalInfo}
        onChange={(e) => setAdditionalInfo(e.target.value)}
        placeholder="e.g. Generate question paper for lower secondary students"
        className="field min-h-[96px] w-full resize-y px-4 py-3 text-sm placeholder:text-[var(--muted)]"
      />
    </div>
  );
}
