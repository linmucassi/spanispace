'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { DbEvent } from '@/types/database';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

const EVENT_TYPE_COLORS: Record<string, string> = {
  webinar: 'bg-blue-100 text-blue-700',
  workshop: 'bg-purple-100 text-purple-700',
  hackathon: 'bg-orange-100 text-orange-700',
  career_fair: 'bg-emerald-100 text-emerald-700',
  bootcamp_session: 'bg-rose-100 text-rose-700',
  networking: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-700',
};

const FORMAT_COLORS: Record<string, string> = {
  online: 'bg-sky-100 text-sky-700',
  hybrid: 'bg-violet-100 text-violet-700',
  in_person: 'bg-teal-100 text-teal-700',
};

function formatEventType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isDeadlineApproaching(deadline: string | null): boolean {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
}

export default function EventsPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('events')
        .select('*')
        .in('status', ['published', 'ongoing'])
        .eq('is_public', true)
        .order('start_date', { ascending: true });

      setEvents(data ?? []);
      setLoading(false);
    }

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
            {t('events.title')}
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            {t('events.subtitle')}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">{t('events.noEvents')}</p>
          </div>
        )}

        {/* Events grid */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const deadlineClose = isDeadlineApproaching(event.registration_deadline);
              const deadlinePassed =
                event.registration_deadline &&
                new Date(event.registration_deadline) < new Date();

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-6 flex flex-col"
                >
                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.event_type && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${EVENT_TYPE_COLORS[event.event_type] ?? EVENT_TYPE_COLORS.other}`}
                      >
                        {formatEventType(event.event_type)}
                      </span>
                    )}
                    {event.format && (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${FORMAT_COLORS[event.format] ?? FORMAT_COLORS.online}`}
                      >
                        {event.format === 'online'
                          ? t('events.online')
                          : event.format === 'hybrid'
                            ? t('events.hybrid')
                            : t('events.inPerson')}
                      </span>
                    )}
                    {event.status === 'ongoing' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        Live
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-3 line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Date */}
                  {event.start_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(event.start_date)}</span>
                    </div>
                  )}

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}

                  {/* Capacity */}
                  {event.capacity && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {event.capacity} {t('events.capacity').toLowerCase()}
                      </span>
                    </div>
                  )}

                  {/* Skills focus pills */}
                  {event.skills_focus && event.skills_focus.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {event.skills_focus.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {event.skills_focus.length > 4 && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs font-medium rounded-full">
                          +{event.skills_focus.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Registration deadline indicator */}
                  {event.registration_deadline && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        {deadlinePassed ? (
                          <span className="text-red-500 font-medium">
                            {t('events.registrationClosed')}
                          </span>
                        ) : deadlineClose ? (
                          <span className="text-amber-600 font-medium">
                            {t('events.deadline')}:{' '}
                            {new Date(event.registration_deadline).toLocaleDateString('en-ZA')}
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {t('events.deadline')}:{' '}
                            {new Date(event.registration_deadline).toLocaleDateString('en-ZA')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
