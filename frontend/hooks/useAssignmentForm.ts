'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useGenerationStore } from '@/store/generationStore';
import { useWebSocket } from '@/hooks/useWebSocket';

export function useAssignmentForm() {
  const router = useRouter();
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

  function startStatusPolling(assignmentId: string) {
    const startedAt = Date.now();
    const interval = window.setInterval(async () => {
      try {
        const { data, status } = await api.get(`/api/assignments/${assignmentId}/paper`);
        if (status === 202) {
          generation.setStatus('processing');
          generation.setStage('generating');
          generation.setProgress(65, data.message || 'AI is generating questions...');
          return;
        }

        if (data.paper) {
          window.clearInterval(interval);
          generation.setStatus('completed');
          generation.setStage('completed');
          generation.setProgress(100, 'Done! Redirecting...');
          window.setTimeout(() => router.replace(`/assignments/create/result/${assignmentId}`), 500);
        }
      } catch (error: any) {
        if (error?.response?.status === 409) {
          window.clearInterval(interval);
          generation.setError(error.response.data?.message || 'Question paper generation failed');
          return;
        }

        if (Date.now() - startedAt > 5 * 60 * 1000) {
          window.clearInterval(interval);
          generation.setError('Generation is taking too long. Check backend worker logs.');
        }
      }
    }, 5000);
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
      startStatusPolling(data.assignmentId);
    } catch {
      generation.setError('Could not start generation');
    } finally {
      setSubmitting(false);
    }
  }

  return { form, errors, submitting, submit };
}
