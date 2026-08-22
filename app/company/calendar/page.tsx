import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveCompanyMembership } from '@/lib/company/resolveCompanyMembership';
import CalendarView, { type CalendarItem } from '@/components/CalendarView';

export default async function CompanyCalendar() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const membership = await resolveCompanyMembership(supabase, user.id);
  if (!membership) redirect('/company/profile');

  const [{ data: interviews }, { data: events }] = await Promise.all([
    supabase
      .from('interviews')
      .select('id, proposed_start, status, location, candidate_profiles(full_name), application:applications(job:jobs(title))')
      .eq('company_id', membership.companyId),
    supabase
      .from('events')
      .select('id, title, start_date')
      .eq('company_id', membership.companyId),
  ]);

  const items: CalendarItem[] = [
    ...((interviews ?? []) as any[]).map((iv) => {
      const candidateName = Array.isArray(iv.candidate_profiles) ? iv.candidate_profiles[0]?.full_name : iv.candidate_profiles?.full_name;
      const application = Array.isArray(iv.application) ? iv.application[0] : iv.application;
      const job = Array.isArray(application?.job) ? application.job[0] : application?.job;
      return {
        id: `interview-${iv.id}`,
        date: iv.proposed_start,
        label: `Interview: ${candidateName ?? 'Candidate'}${job?.title ? ` (${job.title})` : ''}`,
        sublabel: iv.location ?? undefined,
        color: iv.status === 'confirmed' ? 'green' : iv.status === 'declined' || iv.status === 'cancelled' ? 'slate' : 'amber',
        href: '/company/applications',
      } as CalendarItem;
    }),
    ...((events ?? []) as any[]).map((ev) => ({
      id: `event-${ev.id}`,
      date: ev.start_date,
      label: ev.title,
      color: 'brand',
      href: `/events/${ev.id}`,
    } as CalendarItem)),
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Calendar</h1>
        <p className="text-slate-500 text-sm">Interviews and events</p>
      </div>
      <CalendarView items={items} />
    </div>
  );
}
