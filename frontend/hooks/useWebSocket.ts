'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useGenerationStore } from '@/store/generationStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useAssignmentStore } from '@/store/assignmentStore';

interface ProgressData { assignmentId: string; stage?: string; progress: number; message: string }
interface CompleteData { assignmentId: string }
interface FailedData { assignmentId: string; error: string }

export function useWebSocket() {
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const frameRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    const configuredUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL;
    const isFrontendHost = configuredUrl?.includes('.vercel.app') || configuredUrl?.includes('localhost:3000') || configuredUrl?.includes('localhost:3001');
    const socketUrl = configuredUrl && !isFrontendHost ? configuredUrl : undefined;
    if (!socketUrl) return;

    const socket = io(socketUrl, { auth: { token }, withCredentials: true });
    socketRef.current = socket;
    const setProgress = (status: 'queued' | 'processing', data: ProgressData) => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        const store = useGenerationStore.getState();
        store.setStatus(status);
        useLibraryStore.getState().setAssignmentStatus(data.assignmentId, status === 'queued' ? 'queued' : 'processing');
        if (data.stage === 'queued') store.setStage('queued');
        if (data.stage === 'generating') store.setStage(data.progress >= 65 ? 'structuring' : data.progress >= 45 ? 'generating' : 'preparing');
        if (data.stage === 'formatting') store.setStage(data.progress >= 88 ? 'saving' : 'formatting');
        store.setProgress(data.progress, data.message);
      });
    };
    const handleCompleted = (data: CompleteData) => {
      const store = useGenerationStore.getState();
      store.setStatus('completed');
      store.setStage('completed');
      useLibraryStore.getState().setAssignmentStatus(data.assignmentId, 'completed');
      store.setProgress(100, 'Done! Redirecting...');
      socket.emit('unsubscribe', data.assignmentId);
      if (completeTimerRef.current) window.clearTimeout(completeTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      completeTimerRef.current = window.setTimeout(() => router.push(`/assignments/create/result/${data.assignmentId}`), 700);
      resetTimerRef.current = window.setTimeout(() => {
        useGenerationStore.getState().reset();
        useAssignmentStore.getState().resetForm();
      }, 1500);
    };
    const handleFailed = (data: FailedData) => {
      useLibraryStore.getState().setAssignmentStatus(data.assignmentId, 'failed');
      useGenerationStore.getState().setError(data.error);
      socket.emit('unsubscribe', data.assignmentId);
    };
    socket.on('queued', (data: ProgressData) => setProgress('queued', data));
    socket.on('generating', (data: ProgressData) => setProgress('processing', data));
    socket.on('formatting', (data: ProgressData) => setProgress('processing', data));
    socket.on('completed', handleCompleted);
    socket.on('failed', handleFailed);
    socket.on('job:queued', (data: ProgressData) => setProgress('queued', data));
    socket.on('job:processing', (data: ProgressData) => setProgress('processing', data));
    socket.on('job:completed', handleCompleted);
    socket.on('job:failed', handleFailed);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (completeTimerRef.current) window.clearTimeout(completeTimerRef.current);
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
      socket.off('queued');
      socket.off('generating');
      socket.off('formatting');
      socket.off('completed', handleCompleted);
      socket.off('failed', handleFailed);
      socket.off('job:queued');
      socket.off('job:processing');
      socket.off('job:completed', handleCompleted);
      socket.off('job:failed', handleFailed);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, router]);

  const subscribeToAssignment = useCallback((assignmentId: string) => socketRef.current?.emit('subscribe', assignmentId), []);
  const unsubscribe = useCallback((assignmentId: string) => socketRef.current?.emit('unsubscribe', assignmentId), []);

  return useMemo(() => ({ subscribeToAssignment, unsubscribe }), [subscribeToAssignment, unsubscribe]);
}
