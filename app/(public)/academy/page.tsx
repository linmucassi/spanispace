import type { Metadata } from 'next';
import { academy, type AcademyModule } from '@/data/academy';

export const metadata: Metadata = {
  title: 'Academy — AI and Tech Careers, from zero to job ready',
  description:
    'A free South African learning path for ages 16 to 60. A 12 module AI and Tech Careers Bootcamp, a short course, career tracks, a verified salary guide, certifications and real company case studies.',
  alternates: { canonical: '/academy' },
};

const TRACK_DOT: Record<string, string> = {
  Data: 'bg-indigo-500',
  'AI/ML': 'bg-fuchsia-500',
  Emerging: 'bg-fuchsia-500',
  Software: 'bg-teal-500',
  'Cloud/Infra': 'bg-blue-500',
  Security: 'bg-rose-500',
};

function Prose({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`text-slate-600 leading-relaxed ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
function Inline({ html, className = '' }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function ModuleAccordion({ m, open }: { m: AcademyModule; open?: boolean }) {
  return (
    <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" open={open}>
      <summary className="flex items-center gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-sm font-bold text-indigo-600 tabular-nums">
          {String(m.number).padStart(2, '0')}
        </span>
        <span className="flex-1 font-semibold text-slate-900 text-lg leading-snug">{m.title}</span>
        <span className="text-slate-300 text-2xl leading-none transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="px-5 pb-6 border-t border-slate-100">
        <p className="font-serif italic text-lg text-slate-800 my-5">
          <Inline html={m.hookHtml} />
        </p>
        <div className="bg-slate-50 rounded-xl p-4 mb-5">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">By the end you can</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
            {m.outcomes.map((o, i) => (
              <li key={i}><Inline html={o} /></li>
            ))}
          </ul>
        </div>
        <Prose html={m.bodyHtml} className="[&_strong]:text-slate-900 [&_a]:text-indigo-600 [&_a]:underline" />
        {m.keyTerms.length > 0 && (
          <div className="mt-5 pt-4 border-t border-dashed border-slate-200">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Key words in plain language
            </p>
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[auto_1fr]">
              {m.keyTerms.map((k, i) => (
                <div key={i} className="sm:contents">
                  <dt className="font-semibold text-slate-800 text-sm">{k.term}</dt>
                  <dd className="text-sm text-slate-600 mb-2 sm:mb-0"><Inline html={k.planHtml} /></dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {m.activityHtml && (
          <div className="mt-5 bg-indigo-50 rounded-xl p-4">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 mb-1.5">Try this, free</p>
            <p className="text-sm text-slate-700"><Inline html={m.activityHtml} /></p>
          </div>
        )}
      </div>
    </details>
  );
}

function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-indigo-600 mb-2">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-3">{title}</h2>
      {lede && <p className="text-slate-500 max-w-2xl">{lede}</p>}
    </div>
  );
}

const NAV = [
  ['#bootcamp', 'Bootcamp'],
  ['#short', 'Short course'],
  ['#tracks', 'Career tracks'],
  ['#salaries', 'Salaries'],
  ['#certs', 'Certifications'],
  ['#companies', 'Case studies'],
  ['#resources', 'Resources'],
];

export default function AcademyPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <p className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-indigo-400 mb-5">
            SpaniSpace Academy
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight mb-5">
            AI and tech careers, from zero to job ready
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            A South African learning path for anyone aged 16 to 60. Start with no background, understand how AI
            really works, and walk out able to hold a real job or land real freelance work. Free, and built around
            rands, local companies and the way we actually work now.
          </p>
          <div className="flex flex-wrap gap-2 mt-8">
            {[
              [`${academy.bootcamp.length}`, 'bootcamp modules'],
              [`${academy.shortcourse.length}`, 'short course modules'],
              [`${academy.tracks.length}`, 'career tracks'],
              [`${academy.certs.reduce((n, g) => n + g.items.length, 0)}`, 'certifications'],
              ['Jul 2026', 'salaries verified'],
            ].map(([n, label]) => (
              <span key={label} className="text-sm bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-slate-300">
                <b className="text-white">{n}</b> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky sub-nav */}
      <nav className="sticky top-16 z-30 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto py-2.5">
          {NAV.map(([href, label]) => (
            <a key={href} href={href} className="whitespace-nowrap text-sm font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4">
        {/* Start here */}
        <section className="py-14">
          <SectionHead eyebrow="Welcome" title="Read this first" />
          <div className="bg-white border border-slate-200 border-l-4 border-l-indigo-500 rounded-2xl p-6 md:p-8 shadow-sm mb-4">
            <Prose html={academy.spine.programIntroHtml} className="[&_a]:text-indigo-600" />
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">How to use this program</p>
            <Prose html={academy.spine.howToUseHtml} />
          </div>
        </section>

        {/* Bootcamp */}
        <section id="bootcamp" className="py-14 scroll-mt-28">
          <SectionHead
            eyebrow="Program one"
            title="The AI and Tech Careers Bootcamp"
            lede="Twelve modules that build on each other, from what AI actually is to thinking in systems and choosing a career. Tap any module to open it."
          />
          <div className="space-y-3">
            {academy.bootcamp.map((m, i) => (
              <ModuleAccordion key={m.number} m={m} open={i === 0} />
            ))}
          </div>
        </section>

        {/* Short course */}
        <section id="short" className="py-14 scroll-mt-28">
          <SectionHead
            eyebrow="Program two"
            title="The AI Foundations Short Course"
            lede="A fast, practical crash course for the curious and the busy. Become AI literate and confident in a weekend, then decide if the full bootcamp is for you."
          />
          <div className="space-y-3">
            {academy.shortcourse.map((m) => (
              <ModuleAccordion key={m.number} m={m} />
            ))}
          </div>
        </section>

        {/* Tracks */}
        <section id="tracks" className="py-14 scroll-mt-28">
          <SectionHead eyebrow="Choose a direction" title="Career tracks and how the roles differ" />
          <div className="bg-white border border-slate-200 border-l-4 border-l-indigo-500 rounded-2xl p-6 md:p-8 shadow-sm mb-4">
            <Prose html={academy.tracksIntroHtml} />
          </div>
          <div className="space-y-3">
            {academy.tracks.map((t) => (
              <details key={t.name} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <summary className="flex items-center gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 font-bold text-slate-900 text-xl">{t.name}</span>
                  <span className="text-slate-300 text-2xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-6 border-t border-slate-100">
                  <p className="text-slate-500 my-5"><Inline html={t.summaryHtml} /></p>
                  <div className="space-y-3">
                    {t.roles.map((role) => (
                      <div key={role.title} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <h4 className="font-bold text-slate-900 text-lg mb-2">{role.title}</h4>
                        <p className="text-sm text-slate-600 mb-2.5"><Inline html={role.whatHtml} /></p>
                        <p className="text-sm text-slate-600 mb-3">
                          <span className="text-indigo-600 font-semibold text-[11px] uppercase tracking-wider font-mono mr-1.5">How it differs</span>
                          <Inline html={role.differsHtml} />
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Core skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {role.coreSkills.map((s) => (
                                <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600">{s}</span>
                              ))}
                            </div>
                          </div>
                          {role.starterCerts.length > 0 && (
                            <div>
                              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">Starter certifications</p>
                              <div className="flex flex-wrap gap-1.5">
                                {role.starterCerts.map((s) => (
                                  <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-600">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          <span className="text-indigo-600 font-semibold text-[11px] uppercase tracking-wider font-mono mr-1.5">How to break in</span>
                          <Inline html={role.entryHtml} />
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Salaries */}
        <section id="salaries" className="py-14 scroll-mt-28">
          <SectionHead
            eyebrow="What the roles pay"
            title="South African salary guide"
            lede="Monthly gross ranges in rands by seniority, verified July 2026 against OfferZen, MyBroadband, PayScale South Africa, Glassdoor and live listings. These are ranges that most people sit within, not promises."
          />
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Role', 'Intern', 'Junior', 'Mid', 'Senior', 'Lead'].map((h) => (
                    <th key={h} className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {academy.salaries.map((x) => (
                  <tr key={x.role} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2.5 align-middle ${TRACK_DOT[x.track] || 'bg-slate-400'}`} />
                      {x.role}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 tabular-nums whitespace-nowrap">{x.intern}</td>
                    <td className="px-4 py-3.5 text-slate-600 tabular-nums whitespace-nowrap">{x.junior}</td>
                    <td className="px-4 py-3.5 text-slate-600 tabular-nums whitespace-nowrap">{x.mid}</td>
                    <td className="px-4 py-3.5 text-slate-600 tabular-nums whitespace-nowrap">{x.senior}</td>
                    <td className="px-4 py-3.5 text-slate-600 tabular-nums whitespace-nowrap">{x.lead}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-slate-400">
            {[['Data', 'bg-indigo-500'], ['AI and ML', 'bg-fuchsia-500'], ['Software', 'bg-teal-500'], ['Cloud and infra', 'bg-blue-500'], ['Security', 'bg-rose-500']].map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-2"><i className={`w-2.5 h-2.5 rounded-full ${c}`} />{l}</span>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
            <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">How to read these numbers</p>
            <Prose html={academy.spine.salaryCaveatsHtml} />
          </div>
        </section>

        {/* Certs */}
        <section id="certs" className="py-14 scroll-mt-28">
          <SectionHead
            eyebrow="Proof you can do the work"
            title="Certifications that help you get hired"
            lede="Mostly free or low cost, and accessible from South Africa. A certificate does not replace a portfolio, but it opens the first door. Every link goes to the official page."
          />
          <div className="grid md:grid-cols-2 gap-4">
            {academy.certs.map((g) => (
              <div key={g.provider} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h4 className="font-bold text-slate-900 text-lg mb-3">{g.provider}</h4>
                <ul className="space-y-3">
                  {g.items.map((c) => (
                    <li key={c.name}>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline text-sm">{c.name}</a>
                        {c.cost && (
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${/free/i.test(c.cost) ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-slate-500 bg-slate-50 border border-slate-200'}`}>{c.cost}</span>
                        )}
                      </div>
                      <p className="text-[13px] text-slate-500 mt-0.5"><Inline html={c.whyHtml} /></p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section id="companies" className="py-14 scroll-mt-28">
          <SectionHead
            eyebrow="Why this matters"
            title="How South African companies turn AI, cloud and data into money"
            lede="Real examples with real figures where they are public. This is the work these jobs actually do, and why companies pay for it."
          />
          <div className="grid md:grid-cols-2 gap-4">
            {academy.usecases.map((u) => (
              <div key={u.company} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-baseline gap-3 mb-3">
                  <h4 className="font-bold text-slate-900 text-lg">{u.company}</h4>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{u.sector}</span>
                </div>
                <p className="text-sm text-slate-600 mb-3"><Inline html={u.whatHtml} /></p>
                <p className="text-sm text-slate-800">
                  <span className="text-indigo-600 font-semibold text-[11px] uppercase tracking-wider font-mono mr-1.5">The payoff</span>
                  <Inline html={u.impactHtml} />
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section id="resources" className="py-14 scroll-mt-28">
          <SectionHead
            eyebrow="Go deeper, for free"
            title="Resource library"
            lede="Hand picked videos, guides and docs to support the modules. Every link was checked and resolves."
          />
          <div className="grid md:grid-cols-2 gap-3">
            {academy.links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="block bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-indigo-400 hover:-translate-y-0.5 transition-all">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600">{l.kind}</span>
                <p className="font-semibold text-slate-900 mt-1">{l.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{l.note}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Closing */}
        <section className="pb-20">
          <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.16em] text-indigo-400 mb-4">A word before you go</p>
            <div className="text-slate-200 leading-relaxed text-lg [&_p]:mb-4 [&_strong]:text-white [&_a]:text-indigo-300" dangerouslySetInnerHTML={{ __html: academy.spine.closingHtml }} />
          </div>
          <p className="text-xs font-mono text-slate-400 leading-relaxed mt-8">
            Salary figures verified July 2026 against OfferZen, MyBroadband, PayScale South Africa, Glassdoor and live
            listings, and are ranges rather than guarantees. Company case studies drawn from public reporting. All
            resource and certification links checked and resolving at build time.
          </p>
        </section>
      </div>
    </div>
  );
}
