'use client';

/**
 * Home hero (soft-UI redesign, 21 Oct 2026, from docs/dashboard ui and
 * docs/infoghraphics ui). A light sky wash with the pitch on the left and a
 * small collage of floating cards on the right, built from live data: the
 * verified-job count with a by-type breakdown, and the newest listings.
 *
 * It replaced a full-screen Three.js star field whose stats ("2,400+
 * verified jobs", "12K+ active candidates") were hardcoded and not true.
 * Every number here comes from the database or the course catalogue.
 */

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Hammer, MapPin } from 'lucide-react';
import { useTranslation } from '../lib/i18n/context';
import { MeterList } from '@/components/ui/Panel';
import SpaceCanvas from './SpaceCanvas';
import type { Tone } from '@/components/ui/RingGauge';

export type HeroJob = { id: string; role: string; company: string; location: string; type: string };

const TYPE_TONES: Tone[] = ['brand', 'violet', 'emerald', 'amber'];

const Hero: React.FC<{
  jobCount: number;
  courseCount: number;
  pieceJobCategories: number;
  latestJobs: HeroJob[];
  jobsByType: { type: string; count: number }[];
}> = ({ jobCount, courseCount, pieceJobCategories, latestJobs, jobsByType }) => {
  const { t } = useTranslation();

  const stats = [
    { value: jobCount.toLocaleString('en-ZA'), label: t('hero.statVerifiedJobs') },
    { value: String(courseCount), label: t('hero.statPrograms') },
    { value: String(pieceJobCategories), label: t('hero.statPieceJobs') },
  ];

  return (
    // Space art on top, dark in both themes (theme-static keeps the light
    // palette inside, so the white glass cards read the same either way).
    <section className="theme-static space-backdrop relative overflow-hidden rounded-b-[2.5rem]">
      <SpaceCanvas />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-32 pt-32 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:pb-28 lg:pt-40">
        {/* Pitch */}
        <div>
          <Link
            href="/candidate/cv-audit"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-3 text-xs font-semibold text-ink-100 backdrop-blur"
          >
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>
            {/* The string starts "New: ..." ("Okusha: ..." in isiZulu); the chip already says it. */}
            {t('hero.badge').split(':').slice(1).join(':').trim() || t('hero.badge')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl xl:text-[4.25rem]">
            {t('hero.titleLine1')}{' '}
            <span className="bg-gradient-to-r from-brand-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              {t('hero.titleLine2')}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">{t('hero.subtitle')}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/40 transition-colors hover:bg-brand-400"
            >
              {t('hero.browseJobs')} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/training"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              {t('hero.joinBootcamp')}
            </Link>
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="stat-number-light text-4xl">{value}</dd>
                <dd className="mt-1 text-sm text-ink-300">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Live collage */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="panel-glass bg-white/95 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-ink-500">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {t('hero.liveNow')}
                </p>
                <p className="stat-number mt-3 text-6xl">{jobCount.toLocaleString('en-ZA')}</p>
                <p className="mt-1 text-sm text-ink-400">{t('hero.statVerifiedJobs')}</p>
              </div>
            </div>
            {jobsByType.length > 0 && (
              <div className="mt-6">
                <MeterList
                  max={Math.max(1, ...jobsByType.map((j) => j.count))}
                  items={jobsByType.map((j, i) => ({ label: j.type, value: j.count, tone: TYPE_TONES[i % TYPE_TONES.length] }))}
                />
              </div>
            )}
          </div>

          {latestJobs.length > 0 && (
            <div className="panel mt-4 p-3 lg:-ml-10 lg:mr-10">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-300">{t('hero.latestJobs')}</p>
              <ul>
                {latestJobs.map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-ink-50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700">
                        {job.company.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">{job.role}</span>
                        <span className="flex items-center gap-1 truncate text-xs text-ink-400">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden /> {job.location}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-lg bg-ink-50 px-2 py-0.5 text-[11px] font-semibold text-ink-500">{job.type}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href="/piecejobs"
            className="panel-glass bg-white/95 absolute -top-5 right-4 hidden items-center gap-3 rounded-2xl px-4 py-3 transition-shadow hover:shadow-md sm:flex"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Hammer className="h-4 w-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink-900">PieceJobs</span>
              <span className="block text-xs text-ink-400">{t('hero.pieceJobsHint')}</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
