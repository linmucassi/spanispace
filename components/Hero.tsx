'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/context';
import SpaceBackdrop from './SpaceBackdrop';

/**
 * It also had white-to-violet-to-cyan gradient text, gradient buttons and a
 * backdrop-blur glass button, which is the exact costume every generated
 * landing page wears. Solid brand colour instead.
 */

/**
 * MARKETING FIGURES, NOT MEASUREMENTS. Do not wire these to the database and
 * do not treat them as counts.
 *
 * These are aspirational headline numbers Brendon asked for on 9 August 2026,
 * after they were briefly replaced with live counts. The live counts at that
 * point were 15 verified unexpired jobs and 13 courses, against 105 job rows
 * in total, so the figures below are not what the platform currently holds.
 *
 * Recorded here so nobody later reads them as data and builds on them. If they
 * are ever challenged, the real numbers are one query away and this comment is
 * the honest account of where these came from.
 */
const STATS: { value: string; labelKey: string }[] = [
  { value: '2,400+', labelKey: 'hero.statVerifiedJobs' },
  { value: '12K+', labelKey: 'hero.statCandidates' },
  { value: '30+', labelKey: 'hero.statPrograms' },
];

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-ink-950">
      <SpaceBackdrop />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-200 text-xs font-bold mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
          {t('hero.badge')}
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white leading-[1.06] mb-6">
          {t('hero.titleLine1')}{' '}
          <span className="text-brand-400">{t('hero.titleLine2')}</span>
        </h1>

        <p className="max-w-xl text-lg text-ink-300 leading-relaxed mb-10">{t('hero.subtitle')}</p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/jobs"
            className="px-7 py-4 rounded-xl font-bold text-center text-white bg-brand-500 hover:bg-brand-400 transition-colors"
          >
            {t('hero.browseJobs')}
          </Link>
          <Link
            href="/training"
            className="px-7 py-4 rounded-xl font-bold text-center text-white border border-white/20 hover:bg-white/10 transition-colors"
          >
            {t('hero.joinBootcamp')}
          </Link>
        </div>

        {/* See the note on STATS above. These are headline figures, not counts. */}
        <dl className="mt-14 flex flex-wrap gap-x-10 gap-y-6 sm:gap-x-14">
          {STATS.map(({ value, labelKey }) => (
            <div key={labelKey}>
              <dt className="text-sm text-ink-400 order-2">{t(labelKey)}</dt>
              <dd className="font-display text-3xl font-extrabold text-white tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default Hero;
