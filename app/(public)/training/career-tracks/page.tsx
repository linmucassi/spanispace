import type { Metadata } from 'next';
import { academy } from '@/data/academy';
import GuideShell from '@/components/GuideShell';
import { Inline, Prose } from '@/components/Prose';

export const metadata: Metadata = {
  title: 'Career tracks in AI and tech',
  description:
    'Five directions you can take in AI and tech, and the twelve roles inside them. What each role actually does, how it differs from the others, and how to break in from South Africa.',
  alternates: { canonical: '/training/career-tracks' },
};

export default function CareerTracksPage() {
  return (
    <GuideShell
      title="Career tracks"
      lede="Five directions, twelve roles. Tap a track to see what those jobs really do all day."
    >
      <div className="space-y-3">
        {academy.tracks.map((track) => (
          <details
            key={track.name}
            className="group bg-white border border-slate-200 rounded-2xl overflow-hidden"
          >
            <summary className="flex items-center gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="flex-1 font-bold text-slate-900 text-lg">{track.name}</span>
              <span className="text-sm text-slate-400 whitespace-nowrap">
                {track.roles.length} {track.roles.length === 1 ? 'role' : 'roles'}
              </span>
              <span className="text-slate-300 text-2xl leading-none transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="px-5 pb-6 border-t border-slate-100">
              <p className="text-slate-600 my-5">
                <Inline html={track.summaryHtml} />
              </p>
              <div className="space-y-3">
                {track.roles.map((role) => (
                  <div key={role.title} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <h2 className="font-bold text-slate-900 text-lg mb-2">{role.title}</h2>
                    <p className="text-sm text-slate-600 mb-2.5">
                      <Inline html={role.whatHtml} />
                    </p>
                    <p className="text-sm text-slate-600 mb-3">
                      <span className="text-indigo-600 font-semibold text-[11px] uppercase tracking-wider font-mono mr-1.5">
                        How it differs
                      </span>
                      <Inline html={role.differsHtml} />
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Core skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {role.coreSkills.map((skill) => (
                            <span
                              key={skill}
                              className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      {role.starterCerts.length > 0 && (
                        <div>
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Starter certifications
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {role.starterCerts.map((cert) => (
                              <span
                                key={cert}
                                className="text-xs px-2.5 py-1 rounded-full bg-white border border-indigo-200 text-indigo-600"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="text-indigo-600 font-semibold text-[11px] uppercase tracking-wider font-mono mr-1.5">
                        How to break in
                      </span>
                      <Inline html={role.entryHtml} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>

      <details className="group mt-6 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <summary className="flex items-center gap-3 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-semibold text-slate-900">
          <span className="flex-1">How to choose between them</span>
          <span className="text-slate-300 text-2xl leading-none transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="px-5 pb-6 border-t border-slate-100 pt-5">
          <Prose html={academy.tracksIntroHtml} />
        </div>
      </details>
    </GuideShell>
  );
}
