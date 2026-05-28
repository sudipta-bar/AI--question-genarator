import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { QuestionTypeRow } from '@/types';

const defaults: QuestionTypeRow[] = [
  { id: nanoid(), type: 'Multiple Choice Questions', count: 4, marks: 1 },
  { id: nanoid(), type: 'Short Questions', count: 3, marks: 2 },
  { id: nanoid(), type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
  { id: nanoid(), type: 'Numerical Problems', count: 5, marks: 5 },
];

interface AssignmentStore {
  file: File | null;
  filePreview: string | null;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionTypeRow[];
  additionalInfo: string;
  setFile: (file: File | null) => void;
  setSubject: (subject: string) => void;
  setClassName: (className: string) => void;
  setDueDate: (dueDate: string) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionTypeField: (id: string, field: keyof Omit<QuestionTypeRow, 'id'>, value: string | number) => void;
  setAdditionalInfo: (additionalInfo: string) => void;
  resetForm: () => void;
  totalQuestions: () => number;
  totalMarks: () => number;
}

export const useAssignmentStore = create<AssignmentStore>((set, get) => ({
  file: null,
  filePreview: null,
  subject: 'Science',
  className: 'Grade 8',
  dueDate: '',
  questionTypes: defaults,
  additionalInfo: '',
  setFile: (file) => set((state) => {
    if (state.filePreview) URL.revokeObjectURL(state.filePreview);
    return { file, filePreview: file ? URL.createObjectURL(file) : null };
  }),
  setSubject: (subject) => set({ subject }),
  setClassName: (className) => set({ className }),
  setDueDate: (dueDate) => set({ dueDate }),
  addQuestionType: () => set({ questionTypes: [...get().questionTypes, { id: nanoid(), type: 'Multiple Choice Questions', count: 1, marks: 1 }] }),
  removeQuestionType: (id) => set({ questionTypes: get().questionTypes.filter((row) => row.id !== id) }),
  updateQuestionTypeField: (id, field, value) => set({ questionTypes: get().questionTypes.map((row) => (row.id === id ? { ...row, [field]: value } : row)) }),
  setAdditionalInfo: (additionalInfo) => set({ additionalInfo }),
  resetForm: () => set({ file: null, filePreview: null, subject: 'Science', className: 'Grade 8', dueDate: '', questionTypes: defaults.map((r) => ({ ...r, id: nanoid() })), additionalInfo: '' }),
  totalQuestions: () => get().questionTypes.reduce((sum, row) => sum + row.count, 0),
  totalMarks: () => get().questionTypes.reduce((sum, row) => sum + row.count * row.marks, 0),
}));
