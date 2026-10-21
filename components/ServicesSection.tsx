'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import type { ServiceCategory } from '@/lib/services/publicData';
import { ArrowRight, Droplets, Hammer, Leaf, PaintRoller, Shirt, SprayCan, Truck, Zap, ShieldCheck, type LucideIcon } from 'lucide-react';

/**
 * Home page entry to Spanispace PieceJobs: the eight categories most people
 * come for, a way into the full list, and the three steps. Categories come in
 * as props from a static list, so the home page stays statically cached and
 * renders even before the services migration has run.
 */

const ICONS: Record<string, LucideIcon> = {
  cleaning: SprayCan,
  laundry: Shirt,
  painting: PaintRoller,
  plumbing: Droplets,
  gardening: Leaf,
  handyman: Hammer,
  electrical: Zap,
  moving: Truck,
};

export default function ServicesSection({ categories }: { categories: ServiceCategory[] }) {
  const { t } = useTranslation();

  const steps = [
    { title: t('services.step1Title'), body: t('services.step1Body') },
    { title: t('services.step2Title'), body: t('services.step2Body') },
    { title: t('services.step3Title'), body: t('services.step3Body') },
  ];

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{t('services.eyebrow')}</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-ink-900 mt-2">{t('services.title')}</h2>
            <p className="text-ink-500 mt-3 max-w-xl">{t('services.subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/piecejobs" className="px-5 py-3 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors text-center">
              {t('services.browse')}
            </Link>
            <Link href="/register?as=services" className="px-5 py-3 border border-ink-200 text-ink-800 text-sm font-bold rounded-xl hover:border-brand-500 transition-colors text-center">
              {t('services.offer')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-10">
          {categories.map((category) => {
            const Icon = ICONS[category.slug] ?? Hammer;
            return (
              <Link
                key={category.slug}
                href={`/piecejobs/${category.slug}`}
                className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-ink-50/40 p-4 hover:border-brand-500 hover:bg-white transition-colors"
              >
                <span className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-ink-900 group-hover:text-brand-700">{category.name}</span>
              </Link>
            );
          })}
          <Link
            href="/piecejobs"
            className="group flex flex-col justify-between gap-3 rounded-2xl border border-dashed border-ink-200 p-4 hover:border-brand-500 transition-colors"
          >
            <span className="h-10 w-10 rounded-xl bg-ink-100 text-ink-600 flex items-center justify-center">
              <ArrowRight className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-ink-700 group-hover:text-brand-700">{t('services.allCategories')}</span>
          </Link>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="h-8 w-8 shrink-0 rounded-full bg-ink-900 text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <p className="font-semibold text-ink-900">{step.title}</p>
                <p className="text-sm text-ink-500 mt-1">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-sm text-ink-500 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0" aria-hidden />
          {t('services.launchNote')}
        </p>
      </div>
    </section>
  );
}
