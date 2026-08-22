import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CalendarView, { type CalendarItem } from '@/components/CalendarView';

export default async function CandidateCalendar() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect('/login');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const items: CalendarItem[] = [];

  if (profile?.id) {
    const [{ data: interviews }, { data: registrations }] = await Promise.all([
      supabase
        .from('interviews')
        .select('id, proposed_start, status, location, company_profiles(company_name), application:applications(job:jobs(title))')
        .eq('candidate_id', profile.id),
      supabase
        .from('event_registrations')
        .select('event:events(id, title, start_date)')
        .eq('candidate_id', profile.id),
    ]);

    for (const iv of (interviews ?? []) as any[]) {
      const company = Array.isArray(iv.company_profiles) ? iv.company_profiles[0] : iv.company_profiles;
      const application = Array.isArray(iv.application) ? iv.application[0] : iv.application;
      const job = Array.isArray(application?.job) ? application.job[0] : application?.job;
      items.push({
        id: `interview-${iv.id}`,
        date: iv.proposed_start,
        label: `Interview: ${company?.company_name ?? 'Company'}${job?.title ? ` — ${job.title}` : ''}`,
        sublabel: iv.location ?? undefined,
        color: iv.status === 'confirmed' ? 'green' : iv.status === 'declined' || iv.status === 'cancelled' ? 'slate' : 'amber',
        href: '/candidate/applications',
      });
    }

    for (const reg of (registrations ?? []) as any[]) {
      const event = Array.isArray(reg.event) ? reg.event[0] : reg.event;
      if (!event?.start_date) continue;
      items.push({
        id: `event-${event.id}`,
        date: event.start_date,
        label: event.title,
        color: 'brand',
        href: `/events/${event.id}`,
      });
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Calendar</h1>
        <p className="text-slate-500 text-sm">Interviews and events you&apos;re registered for</p>
      </div>
      <CalendarView items={items} />
    </div>
  );
}
