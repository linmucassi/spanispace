import Link from 'next/link';
import RingGauge from '@/components/ui/RingGauge';
import { btnPrimary } from '@/components/ui/Panel';
import { profileChecklist, PROFILE_COMPLETE_THRESHOLD, type ProfileCompletenessInput } from '@/lib/profileCompleteness';

type Props = {
  profileScore: number;
  profile: ProfileCompletenessInput;
  hasApplied: boolean;
};

export default function ProfileCompletenessCard({ profileScore, profile, hasApplied }: Props) {
  if (profileScore >= PROFILE_COMPLETE_THRESHOLD) return null;

  const items = [
    ...profileChecklist(profile),
    { key: 'apply', label: 'Apply to your first job', shortLabel: 'first application', done: hasApplied },
  ];

  const done = items.filter((i) => i.done).length;

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5">
        <div className="flex items-center gap-4">
          <RingGauge value={profileScore} tone="amber" size={56} />
          <div>
            <h2 className="text-base font-bold text-ink-900">Finish your profile</h2>
            <p className="mt-0.5 text-sm text-ink-400">
              {done} of {items.length} done. Companies search complete profiles first.
            </p>
          </div>
        </div>
        <Link href="/candidate/profile" className={btnPrimary}>
          Edit profile
        </Link>
      </div>
      <ul className="grid gap-2 p-6 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.key} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm ${item.done ? 'bg-emerald-50/60' : 'bg-ink-50/70'}`}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                item.done ? 'bg-emerald-500 text-white' : 'border border-dashed border-ink-300 text-ink-300'
              }`}
              aria-hidden
            >
              {item.done ? '✓' : ''}
            </span>
            <span className={item.done ? 'text-ink-400 line-through' : 'font-medium text-ink-700'}>{item.label}</span>
            <span className="sr-only">{item.done ? '(done)' : '(to do)'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
