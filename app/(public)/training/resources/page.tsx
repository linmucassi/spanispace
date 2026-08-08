import type { Metadata } from 'next';
import { academy } from '@/data/academy';
import GuideShell from '@/components/GuideShell';

export const metadata: Metadata = {
  title: 'Free AI and tech learning resources',
  description:
    'Hand picked free videos, guides and documentation to go deeper on the SpaniSpace courses. Every link was checked and resolves.',
  alternates: { canonical: '/training/resources' },
};

export default function ResourcesPage() {
  return (
    <GuideShell
      title="Free resources"
      lede="Videos, guides and docs that go deeper than a lesson can. All free, all checked."
    >
      <div className="grid md:grid-cols-2 gap-3">
        {academy.links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white border border-ink-200 rounded-2xl p-5 hover:border-brand-400 transition-colors"
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-600">
              {link.kind}
            </span>
            <p className="font-semibold text-ink-900 mt-1">{link.title}</p>
            <p className="text-sm text-ink-500 mt-0.5">{link.note}</p>
          </a>
        ))}
      </div>
    </GuideShell>
  );
}
