export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  schoolName: string;
  city: string;
  themePreference?: 'light' | 'dark';
  role: 'teacher' | 'admin';
}

export interface QuestionTypeRow {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  teacherId: string;
  schoolName: string;
  subject: string;
  className: string;
  dueDate?: string;
  questionTypes: Omit<QuestionTypeRow, 'id'>[];
  additionalInfo: string;
  totalQuestions: number;
  totalMarks: number;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  pdfUrl?: string;
  publicId?: string;
  pdfPublicId?: string;
  pdfDownloadUrl?: string;
  pdfResourceType?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
}

export interface GeneratedQuestion {
  questionNumber: number;
  question: string;
  number?: number;
  text?: string;
  options: string[];
  answer: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'easy' | 'moderate' | 'challenging';
  marks: number;
}

export interface GeneratedSection {
  title: string;
  questionType: string;
  instruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  _id?: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  instructions: string;
  sections: GeneratedSection[];
  generatedAt?: string;
}
