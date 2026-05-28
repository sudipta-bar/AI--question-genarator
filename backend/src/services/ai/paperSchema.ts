import { z } from 'zod';

export const DifficultySchema = z.enum(['Easy', 'Moderate', 'Challenging']);

export const QuestionSchema = z.object({
  questionNumber: z.number().int().min(1),
  question: z.string().min(5),
  options: z.array(z.string()).default([]),
  answer: z.string().min(3),
  difficulty: DifficultySchema,
  marks: z.number().int().min(1),
});

export const SectionSchema = z.object({
  title: z.string().min(1),
  questionType: z.string().min(1),
  instruction: z.string().min(1),
  questions: z.array(QuestionSchema).min(1),
});

export const PaperSchema = z.object({
  timeAllowed: z.string().min(1),
  instructions: z.string().min(1),
  sections: z.array(SectionSchema).min(1),
});

export type GeneratedPaperData = z.infer<typeof PaperSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;

export interface AssignmentLike {
  schoolName?: string | null;
  subject: string;
  className: string;
  totalQuestions?: number | null;
  totalMarks?: number | null;
  fileText?: string | null;
  additionalInfo?: string | null;
  questionTypes: { type: string; count: number; marks: number }[];
  regenerateCount?: number | null;
}
