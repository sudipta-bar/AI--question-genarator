import { create } from 'zustand';
import { api } from '@/lib/api';
import { Assignment } from '@/types';

interface LibraryStore {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
  fetchAssignments: () => Promise<void>;
  removeAssignment: (id: string) => Promise<void>;
  setAssignmentStatus: (id: string, status: Assignment['status']) => void;
  updateAssignment: (id: string, assignment: Partial<Assignment>) => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  assignments: [],
  loading: false,
  error: null,
  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<{ assignments: Assignment[] }>('/api/assignments');
      set({ assignments: data.assignments, loading: false });
    } catch {
      set({ assignments: [], loading: false, error: 'Could not load assignments.' });
    }
  },
  removeAssignment: async (id) => {
    await api.delete(`/api/assignments/${id}`);
    set((state) => ({ assignments: state.assignments.filter((assignment) => assignment._id !== id) }));
  },
  setAssignmentStatus: (id, status) => set((state) => ({
    assignments: state.assignments.map((assignment) => (assignment._id === id ? { ...assignment, status } : assignment)),
  })),
  updateAssignment: (id, nextAssignment) => set((state) => ({
    assignments: state.assignments.map((assignment) => (assignment._id === id ? { ...assignment, ...nextAssignment } : assignment)),
  })),
}));
