'use client';

import { useEffect } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useGenerationStore } from '@/store/generationStore';

export function CreateAssignmentPageReset() {
  useEffect(() => {
    const status = useGenerationStore.getState().status;
    if (status === 'completed' || status === 'failed') {
      useGenerationStore.getState().reset();
      useAssignmentStore.getState().resetForm();
    }
  }, []);

  return null;
}
