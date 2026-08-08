'use client';

import { useTranslation } from '../lib/i18n/context';

/**
 * Shown only while the site is being read in isiZulu, and only until a first
 * language speaker has signed off docs/ISIZULU-REVIEW.md.
 *
 * The report link stays hidden until REPORT_ADDRESS is filled in. There is no
 * contact address anywhere on this site yet, and inventing one, or publishing
 * somebody's personal gmail into a public page for scrapers to harvest, would
 * both be worse than shipping the honest notice on its own. Set the constant
 * and the link appears.
 */
const REPORT_ADDRESS = '';

const TranslationBetaNote: React.FC = () => {
  const { locale, t } = useTranslation();
  if (locale !== 'zu') return null;

  return (
    <p className="text-xs text-ink-400 leading-relaxed">
      {t('betaNote.text')}
      {REPORT_ADDRESS && (
        <>
          {' '}
          <a
            href={`mailto:${REPORT_ADDRESS}?subject=isiZulu`}
            className="underline hover:text-brand-400"
          >
            {t('betaNote.report')}
          </a>
        </>
      )}
    </p>
  );
};

export default TranslationBetaNote;
