import { z } from 'zod';
import { AssignmentLike, Difficulty, GeneratedPaperData, PaperSchema } from './paperSchema.js';

type RawRecord = Record<string, unknown>;

function stripCodeFences(rawText: string) {
  return rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function extractJson(rawText: string) {
  const cleaned = stripCodeFences(rawText);
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      return JSON.parse(cleaned.slice(first, last + 1)) as unknown;
    }
    throw new SyntaxError('AI response did not contain a JSON object');
  }
}

function normalizeDifficulty(value: unknown): Difficulty {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'easy') return 'Easy';
  if (normalized === 'challenging' || normalized === 'hard') return 'Challenging';
  return 'Moderate';
}

function normalizeOptions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((option) => String(option).trim())
    .filter(Boolean)
    .map((option, index) => (/^\([a-d]\)/i.test(option) ? option : `(${String.fromCharCode(97 + index)}) ${option}`));
}

function numberFromUnknown(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (match) return Number(match[0]);
  }
  return undefined;
}

function extractAnswerMap(paper: RawRecord) {
  const answerMap = new Map<number, string>();
  const candidates = [paper.answers, paper.answerKey, paper.solutions];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    candidate.forEach((answerValue, index) => {
      if (typeof answerValue === 'string') {
        answerMap.set(index + 1, answerValue.trim());
        return;
      }
      if (!answerValue || typeof answerValue !== 'object') return;
      const answer = answerValue as RawRecord;
      const number = numberFromUnknown(answer.questionNumber ?? answer.number ?? answer.questionNo ?? answer.qNo) ?? index + 1;
      const text = String(answer.answer ?? answer.correctAnswer ?? answer.solution ?? '').trim();
      if (text) answerMap.set(number, text);
    });
  }
  return answerMap;
}

function normalizeAnswer(question: RawRecord, questionNumber: number, answerMap: Map<number, string>, options: string[]) {
  const rawAnswer = String(question.answer ?? question.correctAnswer ?? question.solution ?? answerMap.get(questionNumber) ?? 'Answer not provided.').trim();
  if (!options.length) return rawAnswer.replace(/^Answer:\s*/i, '').trim();

  const cleaned = rawAnswer.replace(/^Answer:\s*/i, '').trim();
  const optionLetterMatch = cleaned.match(/^\(?([a-d])\)?(?:[).:\-\s]+)?(.*)$/i);
  if (optionLetterMatch) {
    const letter = optionLetterMatch[1].toLowerCase();
    const option = options.find((item) => item.toLowerCase().startsWith(`(${letter})`));
    if (option) return option;
  }

  const matchingOption = options.find((option) => {
    const optionText = option.replace(/^\([a-d]\)\s*/i, '').trim().toLowerCase();
    return optionText && cleaned.toLowerCase().includes(optionText);
  });
  return matchingOption ?? cleaned;
}

function normalizePaperShape(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== 'object') return parsed;
  let paper = parsed as RawRecord;
  if (!Array.isArray(paper.sections)) {
    const nestedPaper = Object.values(paper).find((value) =>
      value && typeof value === 'object' && Array.isArray((value as RawRecord).sections),
    );
    if (nestedPaper && typeof nestedPaper === 'object') paper = nestedPaper as RawRecord;
  }

  if (!Array.isArray(paper.sections)) return paper;

  let questionNumber = 1;
  const answerMap = extractAnswerMap(paper);
  return {
    timeAllowed: String(paper.timeAllowed ?? paper.duration ?? paper.time ?? '90 minutes'),
    instructions: String(paper.instructions ?? paper.generalInstructions ?? 'All questions are compulsory unless stated otherwise.'),
    sections: paper.sections.map((sectionValue, sectionIndex) => {
      const section = sectionValue as RawRecord;
      const title = String(section.title ?? `Section ${String.fromCharCode(65 + sectionIndex)}`);
      const questionType = String(section.questionType ?? section.type ?? section.name ?? `${title} Questions`);
      const questions = Array.isArray(section.questions) ? section.questions : [];

      return {
        title,
        questionType,
        instruction: String(section.instruction ?? section.instructions ?? 'Attempt all questions.'),
        questions: questions.map((questionValue) => {
          const question = questionValue as RawRecord;
          const currentNumber = questionNumber;
          const explicitNumber = numberFromUnknown(question.questionNumber ?? question.number ?? question.id);
          const normalizedNumber = explicitNumber && explicitNumber >= currentNumber ? explicitNumber : currentNumber;
          questionNumber = normalizedNumber + 1;
          const options = normalizeOptions(question.options);
          return {
            questionNumber: normalizedNumber,
            question: String(question.question ?? question.text ?? question.prompt ?? '').trim(),
            options,
            answer: normalizeAnswer(question, normalizedNumber, answerMap, options),
            difficulty: normalizeDifficulty(question.difficulty),
            marks: typeof question.marks === 'number' ? question.marks : Number(question.marks ?? 1),
          };
        }),
      };
    }),
  };
}

function fallbackFromText(rawText: string, assignment: AssignmentLike): GeneratedPaperData {
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let globalNumber = 1;
  const sections = assignment.questionTypes.map((qt, sectionIndex) => {
    const sectionTitle = `Section ${String.fromCharCode(65 + sectionIndex)}`;
    const questionLines = lines
      .filter((line) => /^\d+[\).:-]\s+/.test(line))
      .slice(globalNumber - 1, globalNumber - 1 + qt.count);
    const questions = Array.from({ length: qt.count }, (_, index) => ({
      questionNumber: globalNumber++,
      question: (questionLines[index] ?? `${qt.type} question ${index + 1} for ${assignment.subject}.`).replace(/^\d+[\).:-]\s+/, ''),
      options: [],
      answer: 'Answer requires teacher review because the AI response needed fallback parsing.',
      difficulty: normalizeDifficulty(index % 5 === 0 ? 'easy' : index % 5 === 4 ? 'challenging' : 'moderate'),
      marks: qt.marks,
    }));

    return {
      title: sectionTitle,
      questionType: qt.type,
      instruction: `Attempt all questions. Each question carries ${qt.marks} mark${qt.marks === 1 ? '' : 's'}.`,
      questions,
    };
  });

  return PaperSchema.parse({
    timeAllowed: `${Math.max(30, Math.round((assignment.totalMarks ?? 0) * 1.5))} minutes`,
    instructions: 'All questions are compulsory unless stated otherwise.',
    sections,
  });
}

export function parsePaperResponse(rawText: string, assignment: AssignmentLike): GeneratedPaperData {
  try {
    return PaperSchema.parse(normalizePaperShape(extractJson(rawText)));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return fallbackFromText(rawText, assignment);
    }
    throw error;
  }
}

export function isSchemaParseError(error: unknown) {
  return error instanceof SyntaxError || error instanceof z.ZodError;
}
