import { memo } from 'react';
import { GeneratedPaper, GeneratedQuestion } from '@/types';

function getQuestionNumber(question: GeneratedQuestion) {
  return question.questionNumber ?? question.number ?? 1;
}

function formatAnswer(question: GeneratedQuestion) {
  const answer = question.answer?.replace(/^Answer:\s*/i, '').trim() || 'Answer not provided.';
  if (!question.options.length) return answer;

  const optionMatch = answer.match(/^\(?([a-d])\)?(?:[).:\-\s]+)?(.*)$/i);
  if (optionMatch) {
    const letter = optionMatch[1].toLowerCase();
    const option = question.options.find((item) => item.toLowerCase().startsWith(`(${letter})`));
    if (option) return option;
  }
  return answer;
}

export const AnswerKey = memo(function AnswerKey({ paper }: { paper: GeneratedPaper }) {
  return (
    <section className="no-print mx-auto mt-5 max-w-[760px] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-3">
        <h2 className="text-base font-bold">Teacher Answer Key</h2>
        <p className="text-xs text-[var(--muted)]">Answers are mapped directly from each question object and preserve section numbering.</p>
      </div>
      <div className="mt-4 space-y-5">
        {paper.sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-bold">{section.title} - {section.questionType}</h3>
            <div className="mt-2 space-y-2">
              {section.questions.map((question) => (
                <div key={getQuestionNumber(question)} className="grid gap-2 rounded-md bg-[var(--bg)] p-3 text-sm sm:grid-cols-[64px_1fr]">
                  <div className="font-semibold">Q{getQuestionNumber(question)}</div>
                  <div className="leading-6">{formatAnswer(question)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});
