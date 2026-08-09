'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/context';
import SpaceBackdrop from './SpaceBackdrop';

/**
 * The hero used to claim 2,400+ verified jobs, 12K+ active candidates and 30+
 * training programs. None of those were real. The database holds 105 jobs, 15
 * of them active and verified. On a platform whose entire proposition is that
 * a listing here is not a scam, inventing the numbers is the most expensive
 * possible lie, so the counts are now passed in from the actual data and the
 * other two claims are things that are simply true and checkable.
 *
 * It also had white-to-violet-to-cyan gradient text, gradient buttons and a
 * backdrop-blur glass button, which is the exact costume every generated
 * landing page wears. Solid brand colour instead.
 */

export interface HeroStats {
  /** Live, verified, unexpired listings. Counted from the same data the board renders. */
  openJobs: number;
  /** Free courses with lessons on this site. */
  courses: number;
}

const Hero: React.FC<{ stats?: HeroStats }> = ({ stats }) => {
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

        {/* Real numbers or none. */}
        <dl className="mt-14 flex flex-wrap gap-x-10 gap-y-6">
          {stats && stats.openJobs > 0 && (
            <div>
              <dt className="text-sm text-ink-400 order-2">{t('hero.statJobs')}</dt>
              <dd className="font-display text-3xl font-extrabold text-white tabular-nums">
                {stats.openJobs}
              </dd>
            </div>
          )}
          {stats && stats.courses > 0 && (
            <div>
              <dt className="text-sm text-ink-400 order-2">{t('hero.statCourses')}</dt>
              <dd className="font-display text-3xl font-extrabold text-white tabular-nums">
                {stats.courses}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-ink-400 order-2">{t('hero.statPrice')}</dt>
            <dd className="font-display text-3xl font-extrabold text-white">
              {t('hero.statPriceValue')}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};

export default Hero;
