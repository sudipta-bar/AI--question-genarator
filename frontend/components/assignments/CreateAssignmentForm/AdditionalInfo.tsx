'use client';

import { useAssignmentStore } from '@/store/assignmentStore';
import { FloatingTextarea } from '@/components/ui/Input';

export function AdditionalInfo() {
  const { additionalInfo, setAdditionalInfo } = useAssignmentStore();
  return (
    <FloatingTextarea
      label="Additional Information"
      hint="Optional details such as exam duration, syllabus focus, or preferred question style."
      value={additionalInfo}
      onChange={(e) => setAdditionalInfo(e.target.value)}
      rightIcon="○"
    />
  );
}
