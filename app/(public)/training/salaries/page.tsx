import type { Metadata } from 'next';
import { academy } from '@/data/academy';
import GuideShell from '@/components/GuideShell';
import { Prose } from '@/components/Prose';
import T from '@/components/T';

export const metadata: Metadata = {
  title: 'South African tech salary guide',
  description:
    'What twelve AI, data, software, cloud and security roles pay in South Africa, monthly gross in rands from intern to lead. Verified July 2026 against OfferZen, MyBroadband, PayScale South Africa, Glassdoor and live listings.',
  alternates: { canonical: '/training/salaries' },
};

const TRACK_DOT: Record<string, string> = {
  Data: 'bg-brand-500',
  'AI/ML': 'bg-fuchsia-500',
  Emerging: 'bg-fuchsia-500',
  Software: 'bg-teal-500',
  'Cloud/Infra': 'bg-blue-500',
  Security: 'bg-rose-500',
};

const LEGEND: [string, string][] = [
  ['Data', 'bg-brand-500'],
  ['AI and ML', 'bg-fuchsia-500'],
  ['Software', 'bg-teal-500'],
  ['Cloud and infra', 'bg-blue-500'],
  ['Security', 'bg-rose-500'],
];

export default function SalariesPage() {
  return (
    <GuideShell
      title="Salary guide"
      lede="Monthly gross in rands, by seniority. Ranges most people sit within, not promises. Verified July 2026."
    >
      <div className="overflow-x-auto border border-ink-200 rounded-2xl">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-ink-50 text-left">
              {['Role', 'Intern', 'Junior', 'Mid', 'Senior', 'Lead'].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-wider text-ink-400 font-bold border-b border-ink-200"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {academy.salaries.map((row) => (
              <tr key={row.role} className="border-b border-ink-100 last:border-0">
                <th scope="row" className="px-4 py-3.5 font-semibold text-ink-900 text-left">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full mr-2.5 align-middle ${
                      TRACK_DOT[row.track] || 'bg-ink-400'
                    }`}
                  />
                  {row.role}
                </th>
                <td className="px-4 py-3.5 text-ink-600 tabular-nums whitespace-nowrap">{row.intern}</td>
                <td className="px-4 py-3.5 text-ink-600 tabular-nums whitespace-nowrap">{row.junior}</td>
                <td className="px-4 py-3.5 text-ink-600 tabular-nums whitespace-nowrap">{row.mid}</td>
                <td className="px-4 py-3.5 text-ink-600 tabular-nums whitespace-nowrap">{row.senior}</td>
                <td className="px-4 py-3.5 text-ink-600 tabular-nums whitespace-nowrap">{row.lead}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-ink-400">
        {LEGEND.map(([label, colour]) => (
          <span key={label} className="inline-flex items-center gap-2">
            <i className={`w-2.5 h-2.5 rounded-full ${colour}`} />
            {label}
          </span>
        ))}
      </div>

      <details className="group mt-6 bg-white border border-ink-200 rounded-2xl overflow-hidden">
        <summary className="flex items-center gap-3 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-semibold text-ink-900">
          <span className="flex-1">
            <T k="course.howToRead" />
          </span>
          <span className="text-ink-300 text-2xl leading-none transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="px-5 pb-6 border-t border-ink-100 pt-5">
          <Prose html={academy.spine.salaryCaveatsHtml} />
        </div>
      </details>

      <p className="text-xs text-ink-400 leading-relaxed mt-8">
        Verified July 2026 against OfferZen, MyBroadband, PayScale South Africa, Glassdoor and live
        listings. Ranges, not guarantees.
      </p>
    </GuideShell>
  );
}
