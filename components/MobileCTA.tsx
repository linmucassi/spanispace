'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../lib/i18n/context';

/**
 * The floating Browse Jobs bar on mobile.
 *
 * It followed a reader everywhere, including into a course, which is the one
 * place they are meant to be left alone with one thing. It now stays out of the
 * routes where it is either noise or a loop back to where you already are.
 *
 * Clearance at the end of the page comes from `mb-20` on the footer, so this
 * adds no spacer of its own. It also paints no backdrop, because the footer is
 * dark and a light wash behind the button banded straight across it.
 */

// It floats over whatever is at the bottom of the viewport, permanently, which
// is fine on a landing page and wrong everywhere you are actually reading or
// browsing. Screenshots showed it sitting on top of a course card and on top of
// a university deadline. So it now lives only where "go and see the jobs" is
// genuinely the next step: the home page and events.
const SHOWN_ON = new Set(['/', '/events', '/success-stories']);

function isHidden(pathname: string): boolean {
  return !SHOWN_ON.has(pathname);
}

const MobileCTA: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();

  if (isHidden(pathname ?? '')) return null;

  return (
    <div className="md:hidden fixed left-4 right-4 z-40 bottom-[max(1rem,env(safe-area-inset-bottom))]">
      <Link
        href="/jobs"
        className="block w-full bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-xl text-center"
      >
        {t('mobileCta.browseJobs')}
      </Link>
    </div>
  );
};

export default MobileCTA;
