import type { Job } from '@/types';

/**
 * Work types collapse into four kinds, each with its own colour.
 *
 * The job board carries fourteen `type` values, which is too many to tell apart
 * in a scanning glance on a phone. But a reader is really asking one of four
 * questions: is this quick cash, is this study linked, can I do it from home, or
 * is this a steady job. So the colour answers that, and the exact label still
 * shows underneath it.
 *
 * Colours come from the tokens in globals.css, not from a framework palette.
 */
export type WorkKind = 'piece' | 'learn' | 'remote' | 'perm';

export function workKind(type: Job['type']): WorkKind {
  if (type === 'Piece Job' || type === 'Once-off' || type === 'Temporary') return 'piece';
  if (type.startsWith('Learnership') || type === 'Internship') return 'learn';
  if (type === 'Remote' || type === 'Hybrid' || type === 'Hybrid & Remote possible') return 'remote';
  return 'perm';
}

/** Chip styling per kind. Text colours all clear 4.5:1 on their own tint. */
export const WORK_KIND_CHIP: Record<WorkKind, string> = {
  piece: 'bg-amber-50 text-amber-800 border-amber-200',
  learn: 'bg-violet-50 text-violet-800 border-violet-200',
  remote: 'bg-teal-50 text-teal-800 border-teal-200',
  perm: 'bg-brand-50 text-brand-700 border-brand-200',
};

/** The left edge of the card, which is what gives the feed its rhythm. */
export const WORK_KIND_EDGE: Record<WorkKind, string> = {
  piece: 'border-l-amber-500',
  learn: 'border-l-violet-500',
  remote: 'border-l-teal-500',
  perm: 'border-l-brand-500',
};
