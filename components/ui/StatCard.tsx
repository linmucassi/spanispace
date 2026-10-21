import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import RingGauge, { type Tone } from './RingGauge';

const TONE_ICON: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-ink-100 text-ink-500',
};

/**
 * A big-number stat card (the "Earning $128k" card in docs/dashboard ui):
 * icon in a soft circle, a label, a large number that fades from ink to grey,
 * and either a hint line or a ring gauge. Pass `href` to make it a link.
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  hint,
  ring,
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: React.ReactNode;
  /** Draw a ring gauge: value out of max (max defaults to 100). */
  ring?: { value: number; max?: number; label?: React.ReactNode };
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_ICON[tone]}`}>
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            )}
            <p className="text-sm font-medium leading-tight text-ink-500">{label}</p>
          </div>
          <p className="stat-number mt-4 text-4xl">{value}</p>
        </div>
        {ring && <RingGauge value={ring.value} max={ring.max} tone={tone} label={ring.label} size={60} />}
      </div>
      {hint && <div className="mt-3 text-xs text-ink-400">{hint}</div>}
    </>
  );
  const className = 'panel block p-5 transition-shadow';
  return href ? (
    <Link href={href} className={`${className} hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** A small rounded chip, used for trends and statuses next to numbers. */
export function TrendChip({ children, tone = 'emerald' }: { children: React.ReactNode; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-ink-50 text-ink-500 border-ink-100',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}
