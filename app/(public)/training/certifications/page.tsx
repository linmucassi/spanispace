import type { Metadata } from 'next';
import { academy } from '@/data/academy';
import GuideShell from '@/components/GuideShell';
import { Inline } from '@/components/Prose';

export const metadata: Metadata = {
  title: 'Certifications that help you get hired',
  description:
    'Free and low cost AI, data, cloud and security certifications you can take from South Africa. Every link goes to the official provider page.',
  alternates: { canonical: '/training/certifications' },
};

export default function CertificationsPage() {
  return (
    <GuideShell
      title="Certifications"
      lede="Mostly free, all reachable from South Africa. A certificate will not replace a portfolio, but it opens the first door."
    >
      <div className="grid md:grid-cols-2 gap-4">
        {academy.certs.map((group) => (
          <div key={group.provider} className="bg-white border border-ink-200 rounded-2xl p-5">
            <h2 className="font-bold text-ink-900 text-lg mb-3">{group.provider}</h2>
            <ul className="space-y-3">
              {group.items.map((cert) => (
                <li key={cert.name}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-ink-800 hover:text-brand-600 hover:underline text-sm"
                    >
                      {cert.name}
                    </a>
                    {cert.cost && (
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                          /free/i.test(cert.cost)
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : 'text-ink-500 bg-ink-50 border border-ink-200'
                        }`}
                      >
                        {cert.cost}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-ink-500 mt-0.5">
                    <Inline html={cert.whyHtml} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </GuideShell>
  );
}
