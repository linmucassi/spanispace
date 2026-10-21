'use client';

/**
 * The job a company <-> candidate conversation is about, pinned under the
 * thread header so both sides always see it and can jump to it.
 *
 *   - The thread's own job (message_threads.job_id) is the main card, with
 *     this candidate's status for it (applied / shortlisted / invited ...).
 *   - Every other job at this company the candidate applied to or was
 *     invited to is listed underneath. A thread with no job set falls back
 *     to the most recent of those, so there's always context.
 *   - Company team members can switch which job the conversation is about.
 *
 * Everything loads through normal RLS: candidates see their own applications
 * and invites and the jobs they applied to (has_applied_to_job); companies
 * see applications and invites for their own jobs. A job the viewer can't
 * read (e.g. closed, and the candidate never applied) shows as "no longer
 * listed" rather than disappearing.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, ChevronDown, ExternalLink, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Select from '@/components/ui/Select';

type JobInfo = { id: string; title: string; location: string | null; job_type: string | null; status: string | null };
type Related = { job: JobInfo | null; jobId: string; application?: string; invite?: string; at: string };

const APPLICATION_LABEL: Record<string, { text: string; tone: string }> = {
  pending: { text: 'Applied', tone: 'bg-brand-50 text-brand-700' },
  reviewed: { text: 'Application reviewed', tone: 'bg-blue-50 text-blue-700' },
  shortlisted: { text: 'Shortlisted', tone: 'bg-emerald-50 text-emerald-700' },
  rejected: { text: 'Not taken further', tone: 'bg-slate-100 text-slate-600' },
  hired: { text: 'Hired', tone: 'bg-emerald-100 text-emerald-800' },
};
const INVITE_LABEL: Record<string, { text: string; tone: string }> = {
  pending: { text: 'Invited to apply', tone: 'bg-amber-50 text-amber-700' },
  accepted: { text: 'Invite accepted', tone: 'bg-emerald-50 text-emerald-700' },
  declined: { text: 'Invite declined', tone: 'bg-slate-100 text-slate-600' },
};

function statusChip(r: Related | undefined) {
  if (!r) return null;
  const s = r.application ? APPLICATION_LABEL[r.application] : r.invite ? INVITE_LABEL[r.invite] : null;
  return s ? <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.tone}`}>{s.text}</span> : null;
}

export default function ThreadJobContext({
  threadId,
  jobId: initialJobId,
  companyId,
  candidateId,
  viewerSide,
}: {
  threadId: string;
  jobId: string | null;
  companyId: string;
  candidateId: string;
  viewerSide: 'candidate' | 'company';
}) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(initialJobId);
  const [main, setMain] = useState<JobInfo | null>(null);
  const [related, setRelated] = useState<Related[]>([]);
  const [companyJobs, setCompanyJobs] = useState<{ id: string; title: string; status: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      if (!supabase) return;
      const jobCols = 'id, title, location, job_type, status, company_id';
      const [{ data: apps }, { data: invites }, { data: ownJobs }] = await Promise.all([
        supabase
          .from('applications')
          .select(`job_id, status, created_at, job:jobs!inner(${jobCols})`)
          .eq('candidate_id', candidateId)
          .eq('job.company_id', companyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('job_invites')
          .select(`job_id, status, created_at, job:jobs(${jobCols})`)
          .eq('company_id', companyId)
          .eq('candidate_id', candidateId)
          .order('created_at', { ascending: false }),
        viewerSide === 'company'
          ? supabase.from('jobs').select('id, title, status').eq('company_id', companyId).order('created_at', { ascending: false })
          : Promise.resolve({ data: null }),
      ]);

      const byJob = new Map<string, Related>();
      const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? v[0] ?? null : v ?? null);
      for (const a of apps ?? []) {
        byJob.set(a.job_id, { jobId: a.job_id, job: one(a.job) as JobInfo | null, application: a.status, at: a.created_at });
      }
      for (const i of invites ?? []) {
        const existing = byJob.get(i.job_id);
        if (existing) existing.invite = i.status;
        else byJob.set(i.job_id, { jobId: i.job_id, job: one(i.job) as JobInfo | null, invite: i.status, at: i.created_at });
      }
      const list = [...byJob.values()].sort((x, y) => y.at.localeCompare(x.at));

      // The thread's job, or the most recent related one if none is set.
      const focusId = initialJobId ?? list[0]?.jobId ?? null;
      let focus = focusId ? byJob.get(focusId)?.job ?? null : null;
      if (focusId && !focus) {
        const { data } = await supabase.from('jobs').select(jobCols).eq('id', focusId).maybeSingle();
        focus = (data as JobInfo | null) ?? null;
      }

      if (cancelled) return;
      setJobId(focusId);
      setMain(focus);
      setRelated(list);
      setCompanyJobs((ownJobs as { id: string; title: string; status: string }[] | null) ?? []);
      setLoaded(true);
    }
    load();
    return () => { cancelled = true; };
  }, [threadId, initialJobId, companyId, candidateId, viewerSide]);

  async function changeJob(newJobId: string) {
    const supabase = createClient();
    if (!supabase || newJobId === jobId) return;
    setChanging(true);
    setError(null);
    const { error: updateError } = await supabase.from('message_threads').update({ job_id: newJobId || null }).eq('id', threadId);
    setChanging(false);
    if (updateError) { setError('Could not change the job. You may not have permission.'); return; }
    const picked = related.find((r) => r.jobId === newJobId)?.job;
    if (picked) setMain(picked);
    else {
      const { data } = await supabase.from('jobs').select('id, title, location, job_type, status').eq('id', newJobId).maybeSingle();
      setMain((data as JobInfo | null) ?? null);
    }
    setJobId(newJobId || null);
    router.refresh();
  }

  if (!loaded) return <div className="h-14 border-b border-slate-100 bg-slate-50/60 animate-pulse" aria-hidden />;

  const mainRelated = related.find((r) => r.jobId === jobId);
  const others = related.filter((r) => r.jobId !== jobId);
  const viewHref = (id: string) => (viewerSide === 'company' ? `/company/jobs/${id}/edit` : `/jobs/${id}`);
  const appHref = viewerSide === 'company' ? '/company/applications' : '/candidate/applications';

  return (
    <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3 text-sm">
      {jobId ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <Briefcase className="h-4 w-4 mt-0.5 shrink-0 text-brand-600" aria-hidden />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900 truncate">{main?.title ?? 'This job is no longer listed'}</p>
                {statusChip(mainRelated)}
                {main?.status && main.status !== 'active' && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 capitalize">{main.status}</span>
                )}
              </div>
              {(main?.location || main?.job_type) && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  {main?.location && <><MapPin className="h-3 w-3" aria-hidden /> {main.location}</>}
                  {main?.location && main?.job_type && <span aria-hidden>·</span>}
                  {main?.job_type}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
            {main && (
              <Link href={viewHref(main.id)} className="text-brand-600 hover:underline flex items-center gap-1">
                {viewerSide === 'company' ? 'Open job' : 'View job'} <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            )}
            {mainRelated?.application && (
              <Link href={appHref} className="text-brand-600 hover:underline">
                {viewerSide === 'company' ? 'Applications' : 'My application'}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-slate-400" aria-hidden />
          {viewerSide === 'company' ? 'No job linked to this conversation yet. Pick one below so the candidate can see what it’s about.' : 'This conversation isn’t linked to a specific job.'}
        </p>
      )}

      {(others.length > 0 || viewerSide === 'company') && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {others.length > 0 && (
            <button type="button" onClick={() => setShowOthers(!showOthers)} aria-expanded={showOthers} className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">
              {others.length} other job{others.length === 1 ? '' : 's'} with {viewerSide === 'company' ? 'this candidate' : 'this company'}
              <ChevronDown className={`h-3 w-3 transition-transform ${showOthers ? 'rotate-180' : ''}`} aria-hidden />
            </button>
          )}
          {viewerSide === 'company' && companyJobs.length > 0 && (
            <Select
              label="Conversation is about"
              hideLabel
              className="w-64"
              triggerClassName="py-1.5 rounded-lg text-xs border-slate-200"
              disabled={changing}
              value={jobId ?? ''}
              onChange={changeJob}
              options={[
                ...(jobId ? [] : [{ value: '', label: 'Link a job…' }]),
                ...companyJobs.map((j) => ({ value: j.id, label: `${j.title}${j.status !== 'active' ? ` (${j.status})` : ''}` })),
              ]}
            />
          )}
        </div>
      )}

      {showOthers && others.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {others.map((r) => (
            <li key={r.jobId} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-700">{r.job?.title ?? 'Job no longer listed'}</span>
              {statusChip(r)}
              {r.job && (
                <Link href={viewHref(r.job.id)} className="text-brand-600 hover:underline">View</Link>
              )}
              {viewerSide === 'company' && (
                <button type="button" onClick={() => changeJob(r.jobId)} disabled={changing} className="text-slate-500 hover:text-slate-900 underline">
                  Make this the conversation&apos;s job
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
