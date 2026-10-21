/**
 * A circular progress ring, the infographic-style gauge from
 * docs/infoghraphics ui ("Online visitors 312 / max 512"). Pure SVG, so it
 * renders on the server and costs nothing on a slow phone.
 */

export type Tone = 'brand' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';

export const TONE_STROKE: Record<Tone, string> = {
  brand: '#0070c8',
  emerald: '#059669',
  amber: '#d97706',
  violet: '#7c3aed',
  rose: '#e11d48',
  slate: '#6f83a0',
};

export default function RingGauge({
  value,
  max = 100,
  size = 64,
  stroke = 7,
  tone = 'brand',
  label,
  className = '',
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  /** Text in the middle. Defaults to the percentage. */
  label?: React.ReactNode;
  className?: string;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = TONE_STROKE[tone];
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "var(--color-ink-100)" }} strokeWidth={stroke} />
        {ratio > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * ratio} ${c}`}
            style={{ filter: `drop-shadow(0 0 4px ${color}55)` }}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-ink-700 tabular-nums">
        {label ?? `${Math.round(ratio * 100)}%`}
      </span>
    </div>
  );
}
