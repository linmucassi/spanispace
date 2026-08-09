'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/context';
import HeroCanvas from './HeroCanvas';

const STATS = [
  { value: '2,400+', label: 'Verified Jobs' },
  { value: '12K+',   label: 'Active Candidates' },
  { value: '30+',    label: 'Training Programs' },
];

const Hero: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#080818]">
      {/* Three.js particle network */}
      <HeroCanvas />

      {/* Radial glow behind the text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 48%, rgba(99,102,241,0.13) 0%, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-40">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 text-indigo-300 text-xs font-bold mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          {t('hero.badge')}
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08] mb-6">
          {t('hero.titleLine1')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
            {t('hero.titleLine2')}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg text-slate-400 leading-relaxed mb-12">
          {t('hero.subtitle')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/jobs"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-center text-white
                       bg-gradient-to-r from-indigo-600 to-violet-600
                       shadow-lg shadow-indigo-950/60
                       hover:from-indigo-500 hover:to-violet-500 transition-all"
          >
            {t('hero.browseJobs')}
          </Link>
          <Link
            href="/training"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-center text-white
                       bg-white/10 border border-white/15 backdrop-blur-sm
                       hover:bg-white/18 transition-all"
          >
            {t('hero.joinBootcamp')}
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-20 flex flex-wrap justify-center gap-12">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold text-white tabular-nums">{value}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-600 animate-bounce pointer-events-none">
        <span className="text-[10px] font-semibold tracking-widest uppercase">Scroll</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Gradient fade into the white sections below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #ffffff)' }}
      />
    </section>
  );
};

export default Hero;
