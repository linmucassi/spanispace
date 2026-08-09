import Link from 'next/link';
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

  return (
    <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/40">
      <div className="px-6 py-4 border-b border-amber-200/70 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Finish your profile</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {profileScore}% complete — companies search on complete profiles first.
          </p>
        </div>
        <Link
          href="/candidate/profile"
          className="shrink-0 inline-flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Edit profile
        </Link>
      </div>
      <ul className="px-6 py-4 space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2.5 text-sm">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                item.done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {item.done ? '✓' : ''}
            </span>
            <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
