'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
          S
        </div>
        <h1 className="text-6xl font-extrabold text-slate-900 mb-4">{t('notFound.title')}</h1>
        <p className="text-lg text-slate-600 mb-8">{t('notFound.message')}</p>
        <Link
          href="/"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
        >
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
}
