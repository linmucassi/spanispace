'use client';

import { useTranslation } from '../lib/i18n/context';

/**
 * One translated string, usable from inside a server component.
 *
 * The course, lesson and guide pages are server components on purpose: they
 * read data/academy.ts, which is 18 000 words of lesson prose that must never
 * reach the browser bundle. But the locale lives in localStorage and is read by
 * a client context, so a server component cannot know it. That left every label
 * on those pages hardcoded in English while the rest of the site toggled.
 *
 * This is the seam. The page stays on the server and renders <T k="course.next" />
 * for its chrome, so only the label crosses into the client. Same first paint
 * behaviour as the rest of the site, which also starts on English and switches
 * after the provider reads localStorage.
 */
export default function T({
  k,
  vars,
}: {
  k: string;
  vars?: Record<string, string | number>;
}) {
  const { t } = useTranslation();
  let value = t(k);
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.split(`{${name}}`).join(String(replacement));
    }
  }
  return <>{value}</>;
}
