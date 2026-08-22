'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import NotFoundScene from '@/components/NotFoundScene';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1a2e]">
      <NotFoundScene />

      {/* Radial glow behind the text, same trick Hero.tsx uses to keep copy
          readable over a busy scene */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 40% at 50% 88%, rgba(11,26,46,0.75) 0%, transparent 70%)',
        }}
      />

      {/* Anchored to the bottom of the viewport, not vertically centered --
          the 3D scene above already fills the top ~65%, and a centered flex
          layout only pushes half as far as its own padding since the child
          gets re-centered around its new, taller box. */}
      <div className="absolute inset-x-0 bottom-10 z-10 flex flex-col items-center px-4 text-center sm:bottom-14">
        <h1 className="text-5xl font-extrabold text-white sm:text-6xl">{t('notFound.title')}</h1>
        <p className="mt-3 max-w-sm text-lg text-ink-200">{t('notFound.message')}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-brand-500 px-8 py-3 font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-brand-400"
        >
          {t('notFound.backHome')}
        </Link>
      </div>
    </div>
  );
}
