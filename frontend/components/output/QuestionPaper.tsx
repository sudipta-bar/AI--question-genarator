'use client';

import { memo, useState } from 'react';
import { GeneratedPaper } from '@/types';
import { StudentInfoSection } from './StudentInfoSection';
import { SectionBlock } from './SectionBlock';
import { AnswerKey } from './AnswerKey';

export const QuestionPaper = memo(function QuestionPaper({ paper }: { paper: GeneratedPaper }) {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <>
      <article id="question-paper" className="question-paper-card motion-surface mx-auto max-w-[820px] rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 leading-relaxed shadow-[var(--shadow-lg)] sm:p-8 md:p-12">
        <header className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-[var(--text)]">{paper.schoolName}</h1>
          <p className="mt-2 text-base font-semibold text-[var(--text)]">{paper.subject} - {paper.className}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Question Paper</p>
        </header>
        <hr className="my-6 border-[var(--border)]" />
        <div className="grid gap-3 text-[13px] font-semibold sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] px-4 py-3">Time Allowed: {paper.timeAllowed}</div>
          <div className="rounded-xl border border-[var(--border)] px-4 py-3 sm:text-right">Maximum Marks: {paper.maxMarks}</div>
        </div>
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-xs leading-5 text-[var(--muted)]">{paper.instructions}</p>
        <StudentInfoSection className={paper.className} />
        <hr className="my-8 border-[var(--border)]" />
        {paper.sections.map((section) => <SectionBlock key={section.title} section={section} />)}
        <p className="mt-10 text-center text-xs italic text-[var(--muted)]">End of Question Paper</p>
        <div className="no-print mt-6 flex justify-center">
          <button type="button" onClick={() => setShowAnswers((value) => !value)} className="btn-base btn-outline rounded-full">
            {showAnswers ? 'Hide Teacher Answer Key' : 'Show Teacher Answer Key'}
          </button>
        </div>
      </article>
      {showAnswers ? <AnswerKey paper={paper} /> : null}
    </>
  );
});
