import { create } from 'zustand';
import { GeneratedPaper } from '@/types';

type JobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
export type GenerationStage = 'idle' | 'queued' | 'preparing' | 'generating' | 'structuring' | 'formatting' | 'saving' | 'completed' | 'failed';

interface GenerationStore {
  jobId: string | null;
  assignmentId: string | null;
  status: JobStatus;
  stage: GenerationStage;
  progress: number;
  statusMessage: string;
  result: GeneratedPaper | null;
  error: string | null;
  setJobId: (id: string) => void;
  setAssignmentId: (id: string) => void;
  setStatus: (s: JobStatus) => void;
  setStage: (stage: GenerationStage) => void;
  setProgress: (n: number, message?: string) => void;
  setResult: (paper: GeneratedPaper) => void;
  setError: (e: string) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  jobId: null,
  assignmentId: null,
  status: 'idle',
  stage: 'idle',
  progress: 0,
  statusMessage: '',
  result: null,
  error: null,
  setJobId: (jobId) => set({ jobId }),
  setAssignmentId: (assignmentId) => set({ assignmentId }),
  setStatus: (status) => set({ status }),
  setStage: (stage) => set({ stage }),
  setProgress: (progress, statusMessage) => set((state) => ({ progress, statusMessage: statusMessage ?? state.statusMessage })),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error, status: 'failed', stage: 'failed' }),
  reset: () => set({ jobId: null, assignmentId: null, status: 'idle', stage: 'idle', progress: 0, statusMessage: '', result: null, error: null }),
}));
