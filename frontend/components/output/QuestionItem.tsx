import { memo } from 'react';
import { GeneratedQuestion } from '@/types';
import { DifficultyBadge } from './DifficultyBadge';

function getQuestionNumber(question: GeneratedQuestion) {
  return question.questionNumber ?? question.number ?? 1;
}

function getQuestionText(question: GeneratedQuestion) {
  return question.question ?? question.text ?? 'Question text missing';
}

export const QuestionItem = memo(function QuestionItem({ question }: { question: GeneratedQuestion }) {
  const questionNumber = getQuestionNumber(question);
  const questionText = getQuestionText(question);

  return (
    <div className="rounded-md border-b border-dashed border-[var(--border)] pb-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:gap-5">
        <p className="text-[14px] leading-7">
          <span className="mr-2 inline-flex min-w-6 font-bold">{questionNumber}.</span>{questionText}
        </p>
        <div className="no-print flex shrink-0 items-start gap-2 sm:justify-end">
          <DifficultyBadge difficulty={question.difficulty} />
          <span className="pill border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs font-semibold text-[var(--dark)]">{question.marks} {question.marks === 1 ? 'Mark' : 'Marks'}</span>
        </div>
      </div>
      {question.options.length ? (
        <div className="mt-3 grid gap-2 pl-8 text-[13.5px] leading-6 text-[var(--dark)] sm:grid-cols-2">
          {question.options.map((option) => <div key={option}>{option}</div>)}
        </div>
      ) : null}
    </div>
  );
});
