import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../config/env.js';
import { buildPromptMessages } from './ai/promptBuilder.js';
import { parsePaperResponse, isSchemaParseError } from './ai/responseParser.js';
import { enforceMandatoryTeacherRequirements } from './ai/teacherConstraints.js';

const QuestionSchema = z.object({
  questionNumber: z.number(),
  question: z.string().min(5),
  options: z.array(z.string()).default([]),
  answer: z.string().min(5),
  difficulty: z.enum(['Easy', 'Moderate', 'Challenging']),
  marks: z.number().min(1),
});

const SectionSchema = z.object({
  title: z.string(),
  questionType: z.string(),
  instruction: z.string(),
  questions: z.array(QuestionSchema).min(1),
});

export const PaperSchema = z.object({
  timeAllowed: z.string(),
  instructions: z.string(),
  sections: z.array(SectionSchema).min(1),
});

export type GeneratedPaperData = z.infer<typeof PaperSchema>;
type RawRecord = Record<string, any>;

interface AssignmentLike {
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

interface QuestionTemplate {
  text: string;
  options: string[];
  answer: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
}

function parseAIResponse(rawText: string): GeneratedPaperData {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/```\s*$/i, '');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

  const parsed = JSON.parse(cleaned) as unknown;
  return PaperSchema.parse(normalizePaperShape(parsed));
}

function normalizePaperShape(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== 'object') return parsed;
  let paper = parsed as RawRecord;
  if (!Array.isArray(paper.sections)) {
    const nestedPaper = Object.values(paper).find((value) =>
      value && typeof value === 'object' && Array.isArray((value as RawRecord).sections),
    );
    if (nestedPaper && typeof nestedPaper === 'object') {
      paper = nestedPaper as RawRecord;
    }
  }

  if (!Array.isArray(paper.sections)) return paper;

  let questionNumber = 1;
  return {
    timeAllowed: paper.timeAllowed ?? paper.duration ?? paper.time ?? '90 minutes',
    instructions: paper.instructions ?? paper.generalInstructions ?? 'All questions are compulsory unless stated otherwise.',
    sections: paper.sections.map((section: RawRecord, sectionIndex: number) => {
      const questionType = section.questionType ?? section.type ?? section.name ?? `Section ${String.fromCharCode(65 + sectionIndex)} Questions`;
      return {
        title: section.title ?? `Section ${String.fromCharCode(65 + sectionIndex)}`,
        questionType,
        instruction: section.instruction ?? section.instructions ?? 'Attempt all questions.',
        questions: Array.isArray(section.questions) ? section.questions.map((question: RawRecord) => {
          const options = Array.isArray(question.options)
            ? question.options.map((option: string, optionIndex: number) => option.trim().match(/^\([a-d]\)/i) ? option : `(${String.fromCharCode(97 + optionIndex)}) ${option}`)
            : [];
          const currentNumber = typeof question.questionNumber === 'number'
            ? question.questionNumber
            : typeof question.number === 'number'
              ? question.number
              : typeof question.id === 'number'
                ? question.id
                : questionNumber++;
          return {
            questionNumber: currentNumber,
            question: question.question ?? question.text ?? question.prompt ?? 'Question text missing',
            options,
            answer: question.answer ?? question.correctAnswer ?? question.solution ?? 'Answer not provided.',
            difficulty: ['Easy', 'Moderate', 'Challenging'].includes(question.difficulty) ? question.difficulty : 'Moderate',
            marks: typeof question.marks === 'number' ? question.marks : 1,
          };
        }) : [],
      };
    }),
  };
}

function isParseError(error: unknown) {
  return error instanceof SyntaxError || error instanceof z.ZodError;
}

function mistralTimeout() {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Mistral API timeout after 120 seconds')), 120000),
  );
}

function difficultyForIndex(index: number): 'Easy' | 'Moderate' | 'Challenging' {
  const cycle = ['Easy', 'Moderate', 'Moderate', 'Challenging', 'Moderate'] as const;
  return cycle[index % cycle.length];
}

function dsaTemplates(isMcq: boolean): QuestionTemplate[] {
  if (isMcq) {
    return [
      {
        text: 'What is the worst-case time complexity of QuickSort when the pivot is consistently the smallest or largest element?',
        options: ['(a) O(n log n)', '(b) O(n^2)', '(c) O(log n)', '(d) O(n)'],
        difficulty: 'Moderate',
        answer: "(b) O(n^2) - QuickSort's worst case occurs when partitions are maximally unbalanced, so recursive calls process n-1, n-2, and smaller subarrays.",
      },
      {
        text: 'Which data structure follows the Last In, First Out principle?',
        options: ['(a) Queue', '(b) Stack', '(c) Binary search tree', '(d) Graph'],
        difficulty: 'Easy',
        answer: '(b) Stack - A stack removes the most recently inserted element first, which is the Last In, First Out rule.',
      },
      {
        text: 'Which traversal of a binary search tree visits keys in sorted ascending order?',
        options: ['(a) Preorder', '(b) Postorder', '(c) Inorder', '(d) Level order'],
        difficulty: 'Easy',
        answer: '(c) Inorder - In a BST, inorder traversal visits left subtree, root, and right subtree, producing sorted keys.',
      },
      {
        text: 'Which algorithm is commonly used to find the shortest path from one source in a weighted graph with non-negative edge weights?',
        options: ["(a) Dijkstra's algorithm", "(b) Kruskal's algorithm", '(c) Depth-first search', '(d) Heap sort'],
        difficulty: 'Moderate',
        answer: "(a) Dijkstra's algorithm - It repeatedly selects the unvisited vertex with minimum tentative distance and relaxes outgoing edges.",
      },
    ];
  }

  return [
    {
      text: 'Explain how a linked list differs from an array in memory allocation and insertion operations.',
      options: [],
      difficulty: 'Easy',
      answer: 'An array stores elements in contiguous memory and supports direct indexing, but insertion in the middle often requires shifting elements. A linked list stores nodes in non-contiguous memory connected by pointers, so insertion is efficient once the position is known, but random access requires traversal.',
    },
    {
      text: 'Derive the time complexity of binary search and state the condition required before applying it.',
      options: [],
      difficulty: 'Moderate',
      answer: 'Binary search requires sorted data. At each step it halves the search interval, so after k comparisons the remaining size is n/2^k. When n/2^k = 1, k = log2 n, giving O(log n) time complexity.',
    },
    {
      text: 'Compare BFS and DFS for graph traversal and mention one practical use case of each.',
      options: [],
      difficulty: 'Moderate',
      answer: 'BFS explores vertices level by level using a queue and is useful for shortest paths in unweighted graphs. DFS explores deeply using recursion or a stack and is useful for cycle detection, topological sorting, and connected component discovery.',
    },
    {
      text: 'Explain why a hash table can provide O(1) average-case search but O(n) worst-case search.',
      options: [],
      difficulty: 'Challenging',
      answer: 'A hash table maps keys to array indices using a hash function, so search is O(1) on average when collisions are low. In the worst case, many keys may collide into one bucket or probing sequence, forcing a scan of many entries and causing O(n) search time.',
    },
  ];
}

function physicsTemplates(isMcq: boolean): QuestionTemplate[] {
  if (isMcq) {
    return [
      {
        text: "According to Ohm's law, what is the current through a 10 ohm resistor connected to a 20 V battery?",
        options: ['(a) 0.5 A', '(b) 2 A', '(c) 10 A', '(d) 200 A'],
        difficulty: 'Easy',
        answer: "(b) 2 A - By Ohm's law, I = V/R = 20/10 = 2 A.",
      },
      {
        text: 'Which mirror is used as a rear-view mirror in vehicles because it gives a wider field of view?',
        options: ['(a) Plane mirror', '(b) Concave mirror', '(c) Convex mirror', '(d) Cylindrical mirror'],
        difficulty: 'Easy',
        answer: '(c) Convex mirror - It forms erect, diminished images and covers a wider field of view.',
      },
      {
        text: 'What is the SI unit of electric power?',
        options: ['(a) Joule', '(b) Watt', '(c) Coulomb', '(d) Volt'],
        difficulty: 'Easy',
        answer: '(b) Watt - Electric power is the rate of doing electrical work, and its SI unit is watt.',
      },
      {
        text: 'If the speed of a wave is 340 m/s and its frequency is 170 Hz, what is its wavelength?',
        options: ['(a) 0.5 m', '(b) 2 m', '(c) 170 m', '(d) 510 m'],
        difficulty: 'Moderate',
        answer: '(b) 2 m - Using v = f lambda, lambda = 340/170 = 2 m.',
      },
    ];
  }

  return [
    {
      text: "State Ohm's law and describe one condition under which it is valid.",
      options: [],
      difficulty: 'Easy',
      answer: "Ohm's law states that the current through a conductor is directly proportional to the potential difference across it, provided temperature and physical conditions remain constant. Mathematically, V = IR.",
    },
    {
      text: 'Explain why stars appear to twinkle but planets usually do not.',
      options: [],
      difficulty: 'Moderate',
      answer: "Stars appear as point sources, so atmospheric refraction causes rapid changes in their apparent brightness and position. Planets have a visible disc, so fluctuations from different points average out, making twinkling much less noticeable.",
    },
    {
      text: 'A device is rated 1000 W and is used for 2 hours. Calculate the electrical energy consumed in kWh.',
      options: [],
      difficulty: 'Moderate',
      answer: 'Energy consumed = power x time = 1000 W x 2 h = 2000 Wh = 2 kWh.',
    },
    {
      text: 'Describe the difference between series and parallel combinations of resistors with respect to current and voltage.',
      options: [],
      difficulty: 'Challenging',
      answer: 'In series, the same current flows through every resistor and the supply voltage is divided among them. In parallel, the same voltage appears across each branch and the total current is the sum of branch currents.',
    },
  ];
}

function mathTemplates(isMcq: boolean): QuestionTemplate[] {
  if (isMcq) {
    return [
      {
        text: 'What is the value of x if 3x + 7 = 22?',
        options: ['(a) 3', '(b) 5', '(c) 7', '(d) 15'],
        difficulty: 'Easy',
        answer: '(b) 5 - Subtracting 7 gives 3x = 15, so x = 5.',
      },
      {
        text: 'What is the square of 13?',
        options: ['(a) 156', '(b) 169', '(c) 196', '(d) 144'],
        difficulty: 'Easy',
        answer: '(b) 169 - 13 x 13 = 169.',
      },
      {
        text: 'The sum of angles in a triangle is:',
        options: ['(a) 90 degrees', '(b) 180 degrees', '(c) 270 degrees', '(d) 360 degrees'],
        difficulty: 'Easy',
        answer: '(b) 180 degrees - The interior angles of every Euclidean triangle add up to 180 degrees.',
      },
      {
        text: 'If a number is increased by 20% to become 72, what was the original number?',
        options: ['(a) 54', '(b) 58', '(c) 60', '(d) 64'],
        difficulty: 'Moderate',
        answer: '(c) 60 - If original number is x, then 1.2x = 72, so x = 60.',
      },
    ];
  }

  return [
    {
      text: 'Solve the linear equation 5x - 4 = 2x + 11.',
      options: [],
      difficulty: 'Easy',
      answer: 'Move like terms together: 5x - 2x = 11 + 4, so 3x = 15 and x = 5.',
    },
    {
      text: 'Find the area of a triangle with base 12 cm and height 9 cm.',
      options: [],
      difficulty: 'Easy',
      answer: 'Area of a triangle = 1/2 x base x height = 1/2 x 12 x 9 = 54 square cm.',
    },
    {
      text: 'Factorise the expression x^2 + 7x + 12.',
      options: [],
      difficulty: 'Moderate',
      answer: 'We need two numbers whose sum is 7 and product is 12: 3 and 4. Therefore, x^2 + 7x + 12 = (x + 3)(x + 4).',
    },
    {
      text: 'A shopkeeper gives a 15% discount on an item marked at Rs. 800. Find the selling price.',
      options: [],
      difficulty: 'Moderate',
      answer: 'Discount = 15% of 800 = Rs. 120. Selling price = 800 - 120 = Rs. 680.',
    },
  ];
}

function genericTemplates(subject: string, className: string, isMcq: boolean): QuestionTemplate[] {
  if (isMcq) {
    return [
      {
        text: `Which statement best describes a core principle studied in ${subject} at the ${className} level?`,
        options: ['(a) A memorized fact without application', '(b) A concept that explains patterns and solves problems', '(c) An unrelated historical detail', '(d) A purely decorative diagram'],
        difficulty: 'Moderate',
        answer: `(b) A concept that explains patterns and solves problems - ${subject} questions should test understanding and application, not only recall.`,
      },
    ];
  }
  return [
    {
      text: `Explain one important concept from ${subject} that a ${className} student should understand, and describe its practical use.`,
      options: [],
      difficulty: 'Moderate',
      answer: `A strong answer should define the selected ${subject} concept accurately, explain the underlying principle, and connect it to a practical or academic use appropriate for ${className}.`,
    },
  ];
}

function templatesFor(subject: string, className: string, isMcq: boolean): QuestionTemplate[] {
  const key = subject.toLowerCase();
  if (key.includes('data structure') || key.includes('algorithm') || key === 'dsa') return dsaTemplates(isMcq);
  if (key.includes('physics') || key.includes('science')) return key.includes('physics') ? physicsTemplates(isMcq) : physicsTemplates(isMcq);
  if (key.includes('math')) return mathTemplates(isMcq);
  return genericTemplates(subject, className, isMcq);
}

function fallbackPaper(assignment: AssignmentLike): GeneratedPaperData {
  let number = 1;
  const attemptNumber = (assignment.regenerateCount || 0) + 1;
  return PaperSchema.parse({
    timeAllowed: `${Math.max(30, Math.round((assignment.totalMarks ?? 0) * 1.5))} minutes`,
    instructions: 'All questions are compulsory unless stated otherwise.',
    sections: assignment.questionTypes.map((qt, sectionIndex) => {
      const isMcq = qt.type.toLowerCase().includes('multiple choice') || qt.type.toLowerCase().includes('mcq');
      const templates = templatesFor(assignment.subject, assignment.className, isMcq);
      return {
        title: `Section ${String.fromCharCode(65 + sectionIndex)}`,
        questionType: qt.type,
        instruction: `Attempt all questions. Each question carries ${qt.marks} mark${qt.marks === 1 ? '' : 's'}.`,
        questions: Array.from({ length: qt.count }, (_, item) => {
          const template = templates[(item + (assignment.regenerateCount || 0)) % templates.length];
          const repeatSuffix = item < templates.length ? '' : ` Use a fresh example for attempt ${attemptNumber}.`;
          return {
            questionNumber: number++,
            question: `${template.text}${repeatSuffix}`,
            options: isMcq ? template.options : [],
            answer: template.answer,
            difficulty: template.difficulty ?? difficultyForIndex(item),
            marks: qt.marks,
          };
        }),
      };
    }),
  });
}

function hasUsableKey(key: string | undefined) {
  return Boolean(key && !key.includes('your_') && key.trim().length > 10);
}

function buildPrompts(assignment: AssignmentLike) {
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

  const system = `You are an expert Indian school/college teacher with 20+ years of experience 
creating CBSE/ICSE/University examination papers.

STRICT RULES:
- Generate REAL, subject-specific questions based on the exact subject and class provided
- For DSA (Data Structures & Algorithms): ask about arrays, linked lists, trees, graphs, sorting algorithms, time complexity, Big-O notation, stacks, queues etc.
- For Science: ask about actual scientific concepts, formulas, laws
- For Math: include actual calculations, formulas, theorems
- Every question must be unique and educationally valuable
- Answers must be COMPLETE, ACCURATE, and DETAILED
- For MCQ: one option must be clearly correct, others must be plausible distractors
- difficulty must be EXACTLY one of: "Easy", "Moderate", "Challenging"
- Respond ONLY with valid JSON. No markdown, no explanation, no code fences.`;

  const userPrompt = `
UNIQUE GENERATION ID: ${uniqueId}
ATTEMPT NUMBER: ${attemptNumber}
VARIATION STYLE: ${style}

You MUST generate COMPLETELY DIFFERENT questions from any previous attempt.
Do NOT reuse any question topics, wording, or structure from before.

Generate a complete examination question paper with these specs:

School: ${assignment.schoolName || 'Delhi Public School'}
Subject: ${assignment.subject}
Class: ${assignment.className}
Total Questions: ${assignment.totalQuestions}
Total Marks: ${assignment.totalMarks}

Question Distribution:
${assignment.questionTypes.map((qt: any) => 
  `- ${qt.count} ${qt.type} questions, ${qt.marks} mark(s) each`
).join('\n')}

${assignment.fileText ? `Reference Material:\n${assignment.fileText.slice(0, 3000)}` : ''}
${assignment.additionalInfo ? `Special Instructions: ${assignment.additionalInfo}` : ''}

STRICT RULES:
1. Generate REAL questions specific to "${assignment.subject}" for "${assignment.className}" level
2. NO placeholder text like "concept1" or "topic1" - use actual subject concepts
3. Answers must be COMPLETE, ACCURATE and DETAILED (minimum 1 sentence)
4. For MCQ: 4 realistic options, correct answer clearly stated in answer field
5. Difficulty: 30% Easy, 50% Moderate, 20% Challenging
6. difficulty field must be EXACTLY one of: "Easy", "Moderate", "Challenging"
7. Group each question type into its own section (Section A, B, C...)
8. This is attempt ${attemptNumber} - make it COMPLETELY DIFFERENT from attempt ${attemptNumber - 1}

Return ONLY this JSON structure, no markdown, no explanation:
{
  "timeAllowed": "90 minutes",
  "instructions": "All questions are compulsory unless stated otherwise.",
  "sections": [
    {
      "title": "Section A",
      "questionType": "Multiple Choice Questions",
      "instruction": "Attempt all questions. Each question carries 1 mark.",
      "questions": [
        {
          "number": 1,
          "text": "Write actual real question here based on subject",
          "options": ["(a) option1", "(b) option2", "(c) option3", "(d) option4"],
          "difficulty": "Easy",
          "marks": 1,
          "answer": "Write complete accurate answer here with explanation"
        }
      ]
    }
  ]
}

For non-MCQ questions use: "options": []
`;

  return { system, user: userPrompt };
}

async function generateWithOpenAI(system: string, user: string) {
  console.info('[ai-service] OpenAI API call starting');
  const startTime = Date.now();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.95,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('OPENAI API ERROR:', response.status, body);
    throw new Error(`OpenAI generation failed: ${response.status} ${body}`);
  }
  console.log('OpenAI responded in', Date.now() - startTime, 'ms');

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned an empty response');
  return text;
}

async function generateWithMistral(system: string, user: string) {
  console.info('[ai-service] Mistral API call starting');

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  const startTime = Date.now();

  let response: Response;
  try {
    response = await Promise.race([
      fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          temperature: 0.9,
          random_seed: Math.floor(Math.random() * 1000000),
          response_format: { type: 'json_object' },
          messages,
        }),
      }),
      mistralTimeout(),
    ]) as Response;
    console.log('Mistral responded in', Date.now() - startTime, 'ms');
  } catch (apiError) {
    const message = apiError instanceof Error ? apiError.message : 'Unknown Mistral API error';
    console.error('MISTRAL API ERROR:', message);
    console.error('Full error:', apiError);
    throw new Error(`Mistral API failed: ${message}`);
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('MISTRAL API ERROR:', body);
    console.error('Status:', response.status);
    throw new Error(`Mistral API failed: ${response.status} ${body}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Mistral returned an empty response');
  try {
    return text;
  } catch (parseError) {
    if (!isParseError(parseError)) throw parseError;
    console.error('Mistral returned invalid JSON shape, retrying repair:', parseError);
    const retryStartTime = Date.now();
    const retryResponse = await Promise.race([
      fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          temperature: 0.2,
          random_seed: Math.floor(Math.random() * 1000000),
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: `${user}\n\nYour previous response did not match the required JSON schema. Fix it and return ONLY valid JSON with required top-level keys timeAllowed, instructions, sections, and each section must include title, questionType, instruction, questions.\n\nPrevious response:\n${text}` },
          ],
        }),
      }),
      mistralTimeout(),
    ]) as Response;
    console.log('Mistral repair responded in', Date.now() - retryStartTime, 'ms');
    if (!retryResponse.ok) {
      const body = await retryResponse.text();
      console.error('MISTRAL REPAIR API ERROR:', body);
      console.error('Status:', retryResponse.status);
      throw new Error(`Mistral repair failed: ${retryResponse.status} ${body}`);
    }
    const retryData = await retryResponse.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const retryText = retryData.choices?.[0]?.message?.content;
    if (!retryText) throw new Error('Mistral repair returned an empty response');
    return retryText;
  }
}

export async function generatePaper(assignment: AssignmentLike) {
  const { system, user } = buildPromptMessages(assignment);
  let rawText: string | null = null;

  if (hasUsableKey(env.MISTRAL_API_KEY)) {
    rawText = await generateWithMistral(system, user);
    return enforceMandatoryTeacherRequirements(parsePaperResponse(rawText, assignment), assignment);
  }

  if (!hasUsableKey(env.ANTHROPIC_API_KEY)) {
    if (!hasUsableKey(env.OPENAI_API_KEY)) return enforceMandatoryTeacherRequirements(fallbackPaper(assignment), assignment);
    rawText = await generateWithOpenAI(system, user);
    return enforceMandatoryTeacherRequirements(parsePaperResponse(rawText, assignment), assignment);
  }

  console.info('[ai-service] Anthropic API call starting');
  const startTime = Date.now();
  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  let message;
  try {
    message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, temperature: 1, system, messages: [{ role: 'user', content: user }] });
    console.log('Anthropic responded in', Date.now() - startTime, 'ms');
  } catch (apiError) {
    const message = apiError instanceof Error ? apiError.message : 'Unknown Anthropic API error';
    console.error('ANTHROPIC API ERROR:', message);
    console.error('Full error:', apiError);
    throw new Error(`Anthropic API failed: ${message}`);
  }
  const text = message.content.map((part) => (part.type === 'text' ? part.text : '')).join('');
  try {
    return enforceMandatoryTeacherRequirements(parsePaperResponse(text, assignment), assignment);
  } catch (parseError) {
    if (!isSchemaParseError(parseError)) throw parseError;
    const retry = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, temperature: 1, system, messages: [{ role: 'user', content: `${user}\n\nFix this invalid JSON response and return valid JSON only:\n${text}` }] });
    const retryText = retry.content.map((part) => (part.type === 'text' ? part.text : '')).join('');
    return enforceMandatoryTeacherRequirements(parsePaperResponse(retryText, assignment), assignment);
  }
}
