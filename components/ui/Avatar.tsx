'use client';

/**
 * A profile picture with an initials fallback. Used in both chats.
 *
 * Candidates (which includes service providers and company team members
 * who have a candidate profile) have candidate_profiles.avatar_url in the
 * avatars bucket. Companies have company_profiles.logo_url, a typed-in URL.
 * The CSP's img-src only allows Supabase Storage and a couple of hosts, so a
 * logo hosted on the company's own site is blocked. onError falls back to
 * initials rather than showing a broken image.
 */

import { useState } from 'react';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
} as const;

export function initialsOf(name: string): string {
  const parts = name.replace(/[·|]/g, ' ').trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}

export default function Avatar({
  src,
  name,
  size = 'sm',
  className = '',
}: {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const base = `${SIZES[size]} shrink-0 rounded-full`;

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className={`${base} object-cover bg-slate-100 ${className}`}
      />
    );
  }
  return (
    <span aria-hidden className={`${base} inline-flex items-center justify-center bg-brand-50 font-bold text-brand-700 ${className}`}>
      {initialsOf(name)}
    </span>
  );
}
