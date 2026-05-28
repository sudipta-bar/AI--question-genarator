import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface QuestionType {
  type: string;
  count: number;
  marks: number;
}

export interface GeneratedQuestion {
  number: number;
  text: string;
  options: string[];
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
  answer: string;
}
