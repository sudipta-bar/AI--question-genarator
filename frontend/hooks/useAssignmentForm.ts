'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useGenerationStore } from '@/store/generationStore';
import { useWebSocket } from '@/hooks/useWebSocket';

export function useAssignmentForm() {
  const form = useAssignmentStore();
  const generation = useGenerationStore();
  const socket = useWebSocket();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!form.subject.trim()) next.subject = 'Subject is required';
    if (!form.className.trim()) next.className = 'Class is required';
    if (!form.dueDate) next.dueDate = 'Due date is required';
    if (form.dueDate && new Date(form.dueDate) < new Date(new Date().toDateString())) next.dueDate = 'Due date must be today or future date';
    if (form.questionTypes.length < 1) next.questionTypes = 'Add at least one question type';
    form.questionTypes.forEach((row) => {
      if (row.count < 1 || row.marks < 1) next.questionTypes = 'Counts and marks must be at least 1';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    generation.reset();
    generation.setStatus('queued');
    generation.setStage('queued');
    generation.setProgress(10, 'Setting up your assignment...');
    try {
      const payload = new FormData();
      if (form.file) payload.append('file', form.file);
      payload.append('subject', form.subject);
      payload.append('className', form.className);
      payload.append('dueDate', form.dueDate);
      payload.append('questionTypes', JSON.stringify(form.questionTypes.map(({ type, count, marks }) => ({ type, count, marks }))));
      payload.append('additionalInfo', form.additionalInfo);
      const { data } = await api.post('/api/assignments', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      generation.setAssignmentId(data.assignmentId);
      generation.setJobId(data.jobId);
      socket.subscribeToAssignment(data.assignmentId);
    } catch {
      generation.setError('Could not start generation');
    } finally {
      setSubmitting(false);
    }
  }

  return { form, errors, submitting, submit };
}
