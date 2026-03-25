'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/context';

const CTASection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-indigo-50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">{t('cta.title')}</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">{t('cta.subtitle')}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/join-waitlist"
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all"
          >
            {t('cta.joinWaitlist')}
          </Link>
          <Link
            href="/post-job"
            className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold shadow-sm hover:border-indigo-300 transition-all"
          >
            {t('cta.postJob')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
