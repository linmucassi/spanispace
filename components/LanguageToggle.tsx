'use client';

import { useTranslation, Locale } from '../lib/i18n/context';

const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  const toggle = () => {
    setLocale(locale === 'en' ? 'zu' : 'en');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-brand-300 bg-white/80 text-xs font-bold text-slate-700 hover:text-brand-600 transition-all"
      aria-label={`Switch to ${locale === 'en' ? 'isiZulu' : 'English'}`}
    >
      <span className="text-base leading-none">
        {locale === 'en' ? '🇿🇦' : '🇬🇧'}
      </span>
      <span>{locale === 'en' ? 'isiZulu' : 'English'}</span>
    </button>
  );
};

export default LanguageToggle;
