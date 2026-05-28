import { AssignmentLike } from './paperSchema.js';
import { formatTeacherConstraints } from './teacherConstraints.js';

export function buildPromptMessages(assignment: AssignmentLike) {
  const variationStyles = [
    'Focus on conceptual theory and definitions.',
    'Focus on practical real-world applications.',
    'Focus on problem-solving and numerical examples.',
    'Focus on comparison, advantages and disadvantages.',
    'Focus on edge cases and advanced scenarios.',
    'Focus on fundamentals and basic principles.',
  ];

  const attemptNumber = (assignment.regenerateCount || 0) + 1;
  const style = variationStyles[(assignment.regenerateCount || 0) % variationStyles.length];
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const sectionPlan = assignment.questionTypes
    .map((qt, index) => {
      const title = `Section ${String.fromCharCode(65 + index)}`;
      return `- ${title}: ${qt.count} ${qt.type} questions, ${qt.marks} mark(s) each. ${marksGuidance(qt.marks, qt.type)}`;
    })
    .join('\n');
  const mandatoryTeacherRequirements = formatTeacherConstraints(assignment.additionalInfo);

  const system = `You are an expert examination paper setter.

Return only valid JSON. Do not return markdown, prose, code fences, or raw text blocks.
Use this exact normalized structure:
{
  "title": "",
  "timeAllowed": "90 minutes",
  "instructions": "All questions are compulsory unless stated otherwise.",
  "sections": [
    {
      "title": "Section A",
      "questionType": "Short Questions",
      "instruction": "Attempt all questions. Each question carries 2 marks.",
      "questions": [
        {
          "questionNumber": 1,
          "question": "Question text",
          "options": [],
          "answer": "Answer text",
          "difficulty": "easy",
          "marks": 2
        }
      ]
    }
  ]
}

Rules:
- Generate real subject-specific exam questions for the requested class.
- Never use placeholder text.
- Each question object must include questionNumber, question, options, answer, marks, and difficulty.
- Do not create a separate answer key or answer section.
- Answers must stay inside the matching question object.
- Question numbers must be sequential across the whole paper.
- Section titles must be Section A, Section B, Section C, and so on.
- Marks must match the requested marks for that section.
- Difficulty must be easy, moderate, or challenging.
- MCQ sections must include exactly four plausible options and answer must be formatted like "(c) Compiling user programs".
- Non-MCQ sections must use an empty options array and answer must be a complete short paragraph.
- The higher the marks, the more difficult, analytical, and detailed the question and answer must be.
- Difficulty controls cognitive demand: Easy = recall/basic application, Moderate = explanation/application, Challenging = analysis/evaluation/multi-step reasoning.
- Marks control answer depth:
  * 1 mark: simple MCQ or direct concept; answer is one line or one option only.
  * 2 marks: short explanation. If numerical, include a compact Given, Formula, Calculation, and Final Answer.
  * 5 marks: detailed structured answer with points, explanation, steps, examples, or derivation where relevant.
  * 10 marks: long-form theory, detailed numerical, derivation, diagram explanation, or structured essay; answer must be step-by-step and comprehensive.
- Numerical, mathematical, calculation, formula, and algorithm questions must never have vague or incomplete answers.
- For numerical questions worth 2 marks or more, format the answer field with these labels: Given:, Formula:, Substitution:, Calculation:, Final Answer:.
- For 5+ mark numerical questions, include multiple calculation steps and highlight the final result in the Final Answer line.
- For algorithm questions, include ordered steps or pseudocode, key logic, complexity if relevant, and final conclusion.
- Diagram questions must include labels, working/principle, and theory in the answer field.
- Sections must remain balanced and exactly follow the requested counts and marks.
- Answers must be complete enough for a teacher-only answer key, but never create a separate answer key array.
- Mandatory teacher requirements are higher priority than variation style and topic diversity.
- If the teacher requires a topic/question style, at least one final question must explicitly contain that topic and style.`;

  const user = `
UNIQUE GENERATION ID: ${uniqueId}
ATTEMPT NUMBER: ${attemptNumber}
VARIATION STYLE: ${style}

Create an examination question paper.

ASSIGNMENT REQUIREMENTS:
School: ${assignment.schoolName || 'Delhi Public School'}
Subject: ${assignment.subject}
Class: ${assignment.className}
Total Questions: ${assignment.totalQuestions}
Total Marks: ${assignment.totalMarks}

MARKS DISTRIBUTION:
${sectionPlan}

DIFFICULTY RULES:
- Easy questions should test recall or direct application.
- Moderate questions should test explanation, application, or structured solving.
- Challenging questions should test analysis, evaluation, multi-step reasoning, or detailed explanation.
- Use a balanced mix unless a section type or marks value requires otherwise.

${mandatoryTeacherRequirements ? `${mandatoryTeacherRequirements}\n` : 'MANDATORY TEACHER REQUIREMENTS:\n- None provided.\n'}

${assignment.fileText ? `Reference material:\n${assignment.fileText.slice(0, 8000)}` : ''}
${assignment.additionalInfo ? `Teacher notes for context:\n${assignment.additionalInfo}` : ''}

Return valid JSON only.`;

  return { system, user };
}

function marksGuidance(marks: number, type: string) {
  const lowerType = type.toLowerCase();
  const numerical = lowerType.includes('numerical') || lowerType.includes('problem');
  const diagram = lowerType.includes('diagram') || lowerType.includes('graph');
  const special = numerical
    ? 'For numerical items, answers must use Given, Formula, Substitution, Calculation, and Final Answer when worth 2+ marks; 5+ mark answers need a detailed step-by-step calculation breakdown.'
    : diagram
      ? 'For diagram items, answers must explain labels, working/principle, and supporting theory.'
      : '';

  if (marks <= 1) return `Use simple recall or MCQ-level difficulty. Answers must be one line or one correct option. ${special}`;
  if (marks <= 2) return `Use short conceptual questions. Answers must be 2-4 lines with a brief explanation. ${special}`;
  if (marks <= 5) return `Use descriptive, analytical, or calculation-based questions. Answers must include multiple explanation points or structured solving steps in academic style. ${special}`;
  return `Use long-form theory, derivations, detailed numericals, or structured essays. Answers must be step-by-step and comprehensive. ${special}`;
}
