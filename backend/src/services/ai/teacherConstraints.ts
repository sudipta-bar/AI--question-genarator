import { AssignmentLike, GeneratedPaperData } from './paperSchema.js';

export type ConstraintKind = 'question' | 'numerical' | 'diagram';

export interface TeacherConstraint {
  original: string;
  topic: string;
  kind: ConstraintKind;
  keywords: string[];
}

const strictMarkers = [
  'must include',
  'mandatory',
  'required',
  'include at least one',
  'include one',
  'at least one',
  'must contain',
  'should include',
];

const stopWords = new Set([
  'a',
  'an',
  'and',
  'at',
  'for',
  'in',
  'is',
  'of',
  'on',
  'one',
  'question',
  'questions',
  'problem',
  'problems',
  'topic',
  'the',
  'to',
  'with',
]);

export function extractTeacherConstraints(additionalInfo?: string | null): TeacherConstraint[] {
  if (!additionalInfo?.trim()) return [];

  return additionalInfo
    .split(/\r?\n|[.;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => strictMarkers.some((marker) => item.toLowerCase().includes(marker)))
    .map((item) => {
      const kind = inferKind(item);
      const topic = extractTopic(item);
      return {
        original: item,
        topic,
        kind,
        keywords: keywordsForTopic(topic),
      };
    })
    .filter((constraint) => constraint.topic.length > 1 && constraint.keywords.length > 0);
}

export function formatTeacherConstraints(additionalInfo?: string | null) {
  const constraints = extractTeacherConstraints(additionalInfo);
  if (!constraints.length) return '';

  return `MANDATORY TEACHER REQUIREMENTS:
${constraints.map((constraint, index) => `${index + 1}. ${constraint.original}
   - Required topic keywords: ${constraint.keywords.join(', ')}
   - Required question style: ${constraint.kind}`).join('\n')}

These requirements are strict constraints. Every listed requirement MUST appear in the final JSON questions.
If a requirement asks for a numerical problem, include calculation data and a worked answer.
If a requirement asks for a diagram question, ask for a labeled diagram or diagram-based explanation.`;
}

export function enforceMandatoryTeacherRequirements(paper: GeneratedPaperData, assignment: AssignmentLike) {
  const constraints = extractTeacherConstraints(assignment.additionalInfo);
  if (!constraints.length) return paper;

  const missing = constraints.filter((constraint) => !paperContainsConstraint(paper, constraint));
  if (!missing.length) return paper;

  console.warn('[ai-service] mandatory teacher constraints missing; injecting replacements', {
    assignmentSubject: assignment.subject,
    missing: missing.map((constraint) => constraint.original),
  });

  const nextPaper: GeneratedPaperData = {
    ...paper,
    sections: paper.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => ({ ...question, options: [...question.options] })),
    })),
  };

  const usedSlots = new Set<string>();
  for (const constraint of missing) {
    const target = findReplacementSlot(nextPaper, constraint, usedSlots);
    if (!target) continue;
    const { sectionIndex, questionIndex } = target;
    const section = nextPaper.sections[sectionIndex];
    const existing = section.questions[questionIndex];
    usedSlots.add(`${sectionIndex}:${questionIndex}`);
    section.questions[questionIndex] = buildConstraintQuestion(constraint, assignment, section.questionType, existing);
  }

  renumberQuestions(nextPaper);
  return nextPaper;
}

function inferKind(text: string): ConstraintKind {
  const lower = text.toLowerCase();
  if (lower.includes('numerical') || lower.includes('calculation') || lower.includes('compute') || lower.includes('solve')) return 'numerical';
  if (lower.includes('diagram') || lower.includes('draw') || lower.includes('label')) return 'diagram';
  return 'question';
}

function extractTopic(text: string) {
  const normalized = text
    .replace(/^(must include|mandatory|required|include at least one|include one|at least one|must contain|should include)\s+/i, '')
    .replace(/\b(one|a|an)\b/gi, ' ')
    .replace(/\b(numerical|calculation|diagram|draw|labeled|labelled|question|problem|topic|on|about|related to|covering)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const explicitTopic = text.match(/\b(?:on|about|related to|covering)\s+(.+)$/i)?.[1]?.trim();
  return (explicitTopic || normalized).replace(/^(the|a|an)\s+/i, '').trim();
}

function keywordsForTopic(topic: string) {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function paperContainsConstraint(paper: GeneratedPaperData, constraint: TeacherConstraint) {
  const text = paper.sections
    .flatMap((section) => section.questions.map((question) => `${question.question} ${question.answer}`))
    .join(' ')
    .toLowerCase();

  const topicHit = constraint.keywords.every((keyword) => text.includes(keyword));
  if (!topicHit) return false;
  if (constraint.kind === 'numerical') return /\b(calculate|compute|solve|find|formula|given|time|average|waiting|turnaround|substitution)\b/i.test(text);
  if (constraint.kind === 'diagram') return /\b(diagram|draw|label|labeled|labelled|illustrate|mapping)\b/i.test(text);
  return true;
}

function findReplacementSlot(paper: GeneratedPaperData, constraint: TeacherConstraint, usedSlots: Set<string>) {
  const preferredSection = paper.sections.findIndex((section) => {
    const type = section.questionType.toLowerCase();
    if (constraint.kind === 'numerical') return type.includes('numerical') || type.includes('problem');
    if (constraint.kind === 'diagram') return type.includes('diagram') || type.includes('graph');
    return !type.includes('multiple choice') && !type.includes('mcq');
  });

  const sectionIndexes = [
    preferredSection,
    ...paper.sections.map((_, index) => index),
  ].filter((index, position, arr) => index >= 0 && arr.indexOf(index) === position);

  for (const sectionIndex of sectionIndexes) {
    const section = paper.sections[sectionIndex];
    const questionIndex = section.questions.findIndex((_, index) => !usedSlots.has(`${sectionIndex}:${index}`));
    if (questionIndex >= 0) return { sectionIndex, questionIndex };
  }

  return null;
}

function buildConstraintQuestion(
  constraint: TeacherConstraint,
  assignment: AssignmentLike,
  questionType: string,
  existing: GeneratedPaperData['sections'][number]['questions'][number],
): GeneratedPaperData['sections'][number]['questions'][number] {
  const isMcq = questionType.toLowerCase().includes('multiple choice') || questionType.toLowerCase().includes('mcq');
  const topic = titleCase(constraint.topic);

  if (isMcq) {
    return {
      ...existing,
      question: `Which statement best describes ${topic} in ${assignment.subject}?`,
      options: [
        `(a) ${topic} is unrelated to ${assignment.subject}`,
        `(b) ${topic} is a required concept that affects system behaviour`,
        `(c) ${topic} is only a naming convention`,
        `(d) ${topic} removes the need for analysis`,
      ],
      answer: `(b) ${topic} is a required concept that affects system behaviour - this directly satisfies the teacher requirement: ${constraint.original}.`,
      difficulty: existing.difficulty,
    };
  }

  if (constraint.kind === 'numerical') {
    return {
      ...existing,
      question: `Solve a numerical problem on ${topic}. Given three processes with burst times P1 = 6 ms, P2 = 4 ms, and P3 = 8 ms arriving at time 0, calculate the average waiting time using FCFS CPU scheduling.`,
      options: [],
      answer: 'FCFS order is P1, P2, P3. Waiting times are P1 = 0 ms, P2 = 6 ms, and P3 = 10 ms. Average waiting time = (0 + 6 + 10) / 3 = 16 / 3 = 5.33 ms.',
      difficulty: 'Moderate' as const,
    };
  }

  if (constraint.kind === 'diagram') {
    return {
      ...existing,
      question: `Draw and explain a labeled diagram for ${topic}, showing the main components and how they interact.`,
      options: [],
      answer: `A correct diagram should clearly label the main parts of ${topic}, show the direction of interaction or mapping, and explain the role of each label. The explanation must connect the diagram to ${assignment.subject} concepts and directly address the teacher requirement.`,
      difficulty: 'Moderate' as const,
    };
  }

  return {
    ...existing,
    question: `Explain ${topic} in ${assignment.subject} and describe why it is important.`,
    options: [],
    answer: `${topic} is an important concept in ${assignment.subject}. A complete answer should define it, explain its key conditions or components, and give one relevant example. This satisfies the mandatory teacher requirement: ${constraint.original}.`,
    difficulty: existing.difficulty,
  };
}

function renumberQuestions(paper: GeneratedPaperData) {
  let questionNumber = 1;
  for (const section of paper.sections) {
    for (const question of section.questions) {
      question.questionNumber = questionNumber++;
    }
  }
}

function titleCase(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
