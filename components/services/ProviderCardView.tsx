import Link from 'next/link';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { PAYMENT_METHOD_LABELS, UNIT_LABELS, formatRand } from '@/lib/services/config';
import type { ProviderCard } from '@/lib/services/publicData';

export function verifiedLabel(verifiedAt: string | null): string {
  if (!verifiedAt) return 'ID and police clearance checked';
  const date = new Date(verifiedAt).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' });
  return `ID and police clearance checked ${date}`;
}

export function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export default function ProviderCardView({ card }: { card: ProviderCard }) {
  const area = [card.suburb, card.city].filter(Boolean).join(', ') || card.province;
  return (
    <Link
      href={`/services/provider/${card.id}`}
      className="group flex flex-col h-full rounded-2xl border border-ink-100 bg-white p-5 hover:border-brand-500 transition-colors"
    >
      <div className="flex items-start gap-3">
        {card.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" />
        ) : (
          <span className="h-12 w-12 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center shrink-0">
            {initials(card.display_name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 group-hover:text-brand-700">{card.display_name}</p>
          {card.headline && <p className="text-sm text-ink-500 line-clamp-2">{card.headline}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-4">
        {card.category_names.slice(0, 3).map((name) => (
          <span key={name} className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700">{name}</span>
        ))}
        {card.category_names.length > 3 && (
          <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-500">+{card.category_names.length - 3} more</span>
        )}
      </div>

      <div className="mt-auto pt-4 space-y-1.5 text-sm">
        {card.from_price_cents != null && card.from_price_unit && (
          <p className="text-ink-900">
            From <strong>{formatRand(card.from_price_cents)}</strong> <span className="text-ink-500">{UNIT_LABELS[card.from_price_unit]}</span>
          </p>
        )}
        {area && (
          <p className="text-ink-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> {area}
            {card.travel_radius_km ? <span className="text-ink-400">· travels {card.travel_radius_km} km</span> : null}
          </p>
        )}
        <p className="text-ink-500 flex items-center gap-1.5">
          <BadgeCheck className="h-3.5 w-3.5 text-green-600 shrink-0" aria-hidden /> {verifiedLabel(card.verified_at)}
        </p>
        <p className="text-ink-500 flex items-center gap-1.5">
          {card.rating_avg != null ? (
            <><Star className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden /> {Number(card.rating_avg).toFixed(1)} · {card.jobs_completed} jobs</>
          ) : (
            <>New on Spanispace</>
          )}
          <span className="text-ink-400">· {PAYMENT_METHOD_LABELS[card.payment_methods]}</span>
        </p>
      </div>
    </Link>
  );
}
