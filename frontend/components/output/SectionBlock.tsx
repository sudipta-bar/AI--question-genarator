import { memo } from 'react';
import { GeneratedSection } from '@/types';
import { QuestionItem } from './QuestionItem';

export const SectionBlock = memo(function SectionBlock({ section }: { section: GeneratedSection }) {
  return (
    <section className="mt-8">
      <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-4 text-center">
        <h2 className="text-base font-bold uppercase tracking-wide">{section.title}</h2>
        <h3 className="mt-1 text-sm font-semibold">{section.questionType}</h3>
        <p className="mt-1 text-xs italic text-[var(--muted)]">{section.instruction}</p>
      </div>
      <div className="mt-5 space-y-5">
        {section.questions.map((question, index) => <QuestionItem key={question.questionNumber ?? question.number ?? index} question={question} />)}
      </div>
    </section>
  );
});
