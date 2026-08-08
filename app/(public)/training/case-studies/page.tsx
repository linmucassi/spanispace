import type { Metadata } from 'next';
import { academy } from '@/data/academy';
import GuideShell from '@/components/GuideShell';
import { Inline } from '@/components/Prose';

export const metadata: Metadata = {
  title: 'How South African companies make money from AI and data',
  description:
    'Real examples with real figures where they are public. What these jobs actually do inside South African companies, and why the work gets paid for.',
  alternates: { canonical: '/training/case-studies' },
};

export default function CaseStudiesPage() {
  return (
    <GuideShell
      title="Case studies"
      lede="What this work looks like inside real South African companies, and why they pay for it."
    >
      <div className="grid md:grid-cols-2 gap-4">
        {academy.usecases.map((usecase) => (
          <div key={usecase.company} className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="font-bold text-slate-900 text-lg">{usecase.company}</h2>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {usecase.sector}
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              <Inline html={usecase.whatHtml} />
            </p>
            <p className="text-sm text-slate-800">
              <span className="text-indigo-600 font-semibold text-[11px] uppercase tracking-wider font-mono mr-1.5">
                The payoff
              </span>
              <Inline html={usecase.impactHtml} />
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 leading-relaxed mt-8">
        Drawn from public reporting. Figures are the companies&apos; own where they have published them.
      </p>
    </GuideShell>
  );
}
