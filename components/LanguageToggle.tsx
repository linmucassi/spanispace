'use client';

import { useTranslation } from '../lib/i18n/context';

/**
 * The isiZulu carries a BETA marker on purpose.
 *
 * The 52 strings added on 8 August were checked against dictionaries and
 * against a noun class concord table, which caught four wrong number forms.
 * They have not been read by a first language speaker. Presenting them with
 * the same finish as the English would imply a level of care they have not had
 * yet, on a platform whose whole pitch is being built for local people. So the
 * label says what is true, and it comes off the moment someone signs off
 * docs/ISIZULU-REVIEW.md.
 */
const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useTranslation();
  const showingZulu = locale === 'zu';

  return (
    <button
      onClick={() => setLocale(showingZulu ? 'en' : 'zu')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-ink-200 hover:border-brand-300 bg-white text-xs font-bold text-ink-700 hover:text-brand-600 transition-colors"
      aria-label={`Switch to ${showingZulu ? 'English' : 'isiZulu'}`}
    >
      <span className="text-base leading-none">{showingZulu ? '🇬🇧' : '🇿🇦'}</span>
      <span>{showingZulu ? 'English' : 'isiZulu'}</span>
      {showingZulu && (
        <span className="ml-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800">
          Beta
        </span>
      )}
    </button>
  );
};

export default LanguageToggle;
