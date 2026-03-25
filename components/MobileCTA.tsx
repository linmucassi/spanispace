'use client';

import { useTranslation } from '../lib/i18n/context';

const MobileCTA: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-40">
      <a
        href="#jobs"
        className="block w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-2xl shadow-indigo-200 border-2 border-indigo-400 text-center"
      >
        {t('mobileCta.browseJobs')}
      </a>
    </div>
  );
};

export default MobileCTA;
