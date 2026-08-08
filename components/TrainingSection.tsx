'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { TRAININGS } from '../data/constants';
import { useTranslation } from '../lib/i18n/context';
import { isFreeLevel } from '../lib/training-level';
import type { Training } from '../types';

/**
 * The catalogue, and nothing else.
 *
 * This page used to open with a wall of copy and cards carrying three pills,
 * a tag row and a button each. Testers said it was too much to scan. A card is
 * a doorway now, one line of promise and one line of facts, and the whole card
 * is the link. Everything the course actually says lives on the course page.
 *
 * Course lengths arrive as props because working them out means reading
 * data/academy.ts, which is a large file of lesson prose. It is computed on the
 * server so none of it ships to the browser.
 */

export interface CourseMeta {
  lessons: number;
  minutes: number;
}

export interface GuideCard {
  slug: string;
  title: string;
  blurb: string;
  count: string;
}

type Access = 'free' | 'paid' | 'partner';
type Filter = 'all' | Access;

const FILTERS: Filter[] = ['all', 'free', 'paid', 'partner'];

function accessOf(item: Training): Access {
  // A partner sets their own price, so we never call their course free or paid.
  if (item.external) return 'partner';
  return isFreeLevel(item.level) ? 'free' : 'paid';
}

const TrainingSection: React.FC<{
  courseMeta: Record<string, CourseMeta>;
  guides?: GuideCard[];
  /**
   * The home page shows a taste of the catalogue, three cards and a way in.
   * The full grid, the filters and the guides belong on /training, where a
   * reader has asked for them.
   */
  preview?: boolean;
}> = ({ courseMeta, guides = [], preview = false }) => {
  const now = new Date();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    if (preview) return TRAININGS.slice(0, 3);
    return filter === 'all' ? TRAININGS : TRAININGS.filter((item) => accessOf(item) === filter);
  }, [filter, preview]);

  const filterLabel: Record<Filter, string> = {
    all: t('training.filterAll'),
    free: t('training.filterFree'),
    paid: t('training.filterPaid'),
    partner: t('training.filterPartner'),
  };

  // One h1 per page. On the home page this section is a supporting block.
  const Heading = preview ? 'h2' : 'h1';

  return (
    <div className="bg-ink-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <Heading className="text-4xl md:text-5xl font-bold tracking-tight">
          {t('training.title')}
        </Heading>
        <p className="text-ink-400 mt-3 max-w-xl">{t('training.subtitle')}</p>

        {!preview && (
          <div
            className="flex flex-wrap gap-2 mt-8 mb-8"
            role="group"
            aria-label={t('training.filterLabel')}
          >
            {FILTERS.map((option) => {
              const active = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  aria-pressed={active}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    active
                      ? 'bg-white text-ink-900'
                      : 'bg-ink-800 text-ink-300 border border-ink-700 hover:border-brand-500'
                  }`}
                >
                  {filterLabel[option]}
                </button>
              );
            })}
          </div>
        )}

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${preview ? 'mt-8' : ''}`}>
          {visible.map((item) => {
            const isPast = item.date ? new Date(item.date) < now : false;
            const access = accessOf(item);
            const meta = item.courseSlug ? courseMeta[item.courseSlug] : undefined;

            // One line of facts under the promise, in the order that helps a
            // reader decide: how long is it, or where does it take me.
            let factLine: string;
            if (meta) {
              factLine = `${t('training.lessonCount').replace('{n}', String(meta.lessons))} · ${t(
                'training.minutes'
              ).replace('{n}', String(meta.minutes))}`;
            } else if (item.external) {
              factLine = t('training.onProvider').replace('{provider}', item.provider);
            } else if (isPast) {
              factLine = t('training.pastEvent');
            } else if (item.date) {
              factLine = item.date;
            } else {
              factLine = t('training.comingSoon');
            }

            const cardClass = `group flex flex-col h-full bg-ink-800 border border-ink-700 rounded-2xl p-6 transition-colors ${
              isPast ? 'opacity-60' : 'hover:border-brand-500'
            }`;

            const body = (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      access === 'free'
                        ? 'text-emerald-400'
                        : access === 'paid'
                          ? 'text-amber-400'
                          : 'text-ink-400'
                    }`}
                  >
                    {access === 'free'
                      ? t('training.free')
                      : access === 'paid'
                        ? t('training.paid')
                        : t('training.partnerCourse')}
                  </span>
                </div>

                <h2
                  className={`text-xl font-bold leading-snug ${isPast ? '' : 'group-hover:text-brand-400'}`}
                >
                  {item.title}
                </h2>
                <p className="text-ink-400 text-sm mt-1.5">{item.description}</p>

                <p className="mt-auto pt-5 text-xs text-ink-500">
                  {item.provider} · {factLine}
                </p>
              </>
            );

            if (isPast) {
              return (
                <div key={item.id} className={cardClass} aria-disabled="true">
                  {body}
                </div>
              );
            }

            if (item.external) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClass}
                >
                  {body}
                </a>
              );
            }

            return (
              <Link key={item.id} href={item.href} className={cardClass}>
                {body}
              </Link>
            );
          })}
        </div>

        {preview ? (
          <Link
            href="/training"
            className="inline-block mt-8 bg-white text-ink-900 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors"
          >
            {t('training.seeAll')}
          </Link>
        ) : (
          <>
            <h2 className="text-xs font-bold uppercase tracking-widest text-ink-500 mt-16 mb-4">
              {t('training.guidesTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {guides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/training/${guide.slug}`}
                  className="group bg-ink-800/60 border border-ink-700 rounded-2xl p-5 transition-colors hover:border-brand-500"
                >
                  <p className="font-bold group-hover:text-brand-400">{guide.title}</p>
                  <p className="text-sm text-ink-400 mt-1">{guide.blurb}</p>
                  <p className="text-xs text-ink-500 mt-3">{guide.count}</p>
                </Link>
              ))}
            </div>

            <p className="text-xs text-ink-500 mt-10">{t('training.pricingNote')}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TrainingSection;
