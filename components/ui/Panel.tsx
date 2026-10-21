/**
 * Building blocks of the soft UI (21 Oct 2026, docs/dashboard ui):
 * - Panel: a floating white card with an optional header row.
 * - PageHeader: a two-tone page title ("Product overview": ink, then grey).
 * - MeterList: horizontal bars with a glowing end dot, after the bar charts
 *   in docs/infoghraphics ui.
 */

import { TONE_STROKE, type Tone } from './RingGauge';

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = 'p-6',
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`panel overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 px-6 pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-ink-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-ink-400">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PageHeader({
  title,
  muted,
  subtitle,
  actions,
  leading,
}: {
  title: React.ReactNode;
  /** Second part of the title, shown in grey. */
  muted?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Something before the title, such as an avatar. */
  leading?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        {leading}
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
            {title}
            {muted && <span className="text-ink-300"> {muted}</span>}
          </h1>
          {subtitle && <p className="mt-1.5 text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export type Meter = { label: React.ReactNode; value: number; tone?: Tone; suffix?: React.ReactNode };

export function MeterList({ items, max }: { items: Meter[]; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-4">
      {items.map((item, i) => {
        const pct = top > 0 ? Math.min(100, (item.value / top) * 100) : 0;
        const color = TONE_STROKE[item.tone ?? 'brand'];
        return (
          <li key={i}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-ink-700">{item.label}</span>
              <span className="shrink-0 tabular-nums text-ink-500">{item.suffix ?? item.value}</span>
            </div>
            <div className="relative h-2 rounded-full bg-ink-100">
              {pct > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}33, ${color})` }}
                >
                  <span
                    className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white"
                    style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Primary and secondary pill buttons, as links. */
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-colors hover:bg-brand-700';
export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 shadow-sm transition-colors hover:border-ink-300 hover:text-ink-900';
