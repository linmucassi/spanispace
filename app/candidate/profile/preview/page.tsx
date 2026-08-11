import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import AvatarUpload from '@/components/candidate/AvatarUpload';
import { WORK_TYPE_LABELS } from '@/components/candidate/WorkExperience';

// A read-only rendering of the signed-in candidate's own data, styled like a
// profile card, so a candidate can see roughly what a good profile looks
// like before applying anywhere. Deliberately NOT a live reuse of the
// company-facing view in app/company/candidates/CandidateSearch.tsx -- that
// view is only reachable by a company after a candidate has applied to one
// of their jobs (see the RLS policy "Companies read applicant profiles" in
// supabase/fix-security-hardening.sql), so it would show nothing for anyone
// who hasn't applied yet, exactly the person most likely to want a preview.
// This page instead reads the candidate's own rows under their own existing
// RLS access, the same way /candidate/profile itself does.

export const metadata = {
  title: 'Preview My Profile | Spanispace',
};

export default async function CandidateProfilePreviewPage() {
  const supabase = await createServerSupabase();

  if (!supabase) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-500">Supabase is not configured.</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-slate-500">Please sign in to preview your profile.</p>
      </div>
    );
  }

  const [profileRes, educationRes, workRes] = await Promise.all([
    supabase
      .from('candidate_profiles')
      .select('full_name, location, skills, professional_summary, portfolio_url, linkedin_url, github_url, avatar_url, verified')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('candidate_education')
      .select('id, institution, qualification, field_of_study, duration_text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('work_experiences')
      .select('id, job_title, employer, work_type, location, duration_text, duties, skills_gained')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const profile = profileRes.data;
  const education = educationRes.data ?? [];
  const work = workRes.data ?? [];

  const links = [
    profile?.portfolio_url ? { label: 'Portfolio', href: profile.portfolio_url } : null,
    profile?.linkedin_url ? { label: 'LinkedIn', href: profile.linkedin_url } : null,
    profile?.github_url ? { label: 'GitHub', href: profile.github_url } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Preview My Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Roughly how a complete profile reads. Not a live view from any specific employer.
          </p>
        </div>
        <Link
          href="/candidate/profile"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 whitespace-nowrap"
        >
          ← Back to editing
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <AvatarUpload
            userId={user.id}
            avatarUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name ?? ''}
            editable={false}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {profile?.full_name || 'Your name'}
              </h2>
              {profile?.verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                  Verified
                </span>
              )}
            </div>
            {profile?.location && <p className="text-sm text-slate-500">{profile.location}</p>}
          </div>
        </div>

        {profile?.professional_summary ? (
          <p className="text-sm text-slate-700 leading-relaxed">{profile.professional_summary}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">
            No professional summary yet — add one on your profile so employers see what you bring.
          </p>
        )}

        {profile?.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill: string) => (
              <span
                key={skill}
                className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-4 text-sm">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                {link.label} ↗
              </a>
            ))}
          </div>
        )}
      </div>

      {education.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Education</h3>
          <div className="space-y-3">
            {education.map((entry) => (
              <div key={entry.id}>
                <p className="text-sm font-medium text-slate-900">
                  {entry.institution}
                  {entry.qualification ? ` · ${entry.qualification}` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  {[entry.field_of_study, entry.duration_text].filter(Boolean).join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {work.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Work Experience</h3>
          <div className="space-y-4">
            {work.map((entry) => (
              <div key={entry.id}>
                <p className="text-sm font-medium text-slate-900">
                  {entry.job_title}
                  {entry.employer ? ` · ${entry.employer}` : ''}
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    {WORK_TYPE_LABELS[entry.work_type] ?? entry.work_type}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {[entry.location, entry.duration_text].filter(Boolean).join(' · ')}
                </p>
                {entry.duties && <p className="text-sm text-slate-600 mt-1">{entry.duties}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
