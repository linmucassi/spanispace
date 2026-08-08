'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { DbEvent } from '@/types/database';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Tag,
  Monitor,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

function formatEventType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventDetailPage() {
  const params = useParams();
  const { t } = useTranslation();
  const eventId = params.id as string;

  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [registrationCount, setRegistrationCount] = useState<number>(0);

  const checkRegistration = useCallback(
    async (supabase: ReturnType<typeof createClient>, uid: string) => {
      if (!supabase) return;
      const { data } = await supabase
        .from('event_registrations')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('user_id', uid)
        .neq('status', 'cancelled')
        .maybeSingle();

      if (data) {
        setIsRegistered(true);
        setRegistrationId(data.id);
      }
    },
    [eventId],
  );

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Fetch event
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      setEvent(eventData);

      // Fetch registration count
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .neq('status', 'cancelled');

      setRegistrationCount(count ?? 0);

      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        await checkRegistration(supabase, user.id);
      }

      setLoading(false);
    }

    fetchData();
  }, [eventId, checkRegistration]);

  async function handleRegister() {
    const supabase = createClient();
    if (!supabase || !userId) return;

    setActionLoading(true);
    setMessage(null);

    const { error } = await supabase.from('event_registrations').insert({
      event_id: eventId,
      user_id: userId,
      status: 'registered',
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setIsRegistered(true);
      setRegistrationCount((c) => c + 1);
      setMessage({ type: 'success', text: t('events.registrationSuccess') });
      // Re-fetch registration ID
      await checkRegistration(supabase, userId);
    }

    setActionLoading(false);
  }

  async function handleCancelRegistration() {
    const supabase = createClient();
    if (!supabase || !registrationId) return;

    setActionLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('id', registrationId);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setIsRegistered(false);
      setRegistrationId(null);
      setRegistrationCount((c) => Math.max(0, c - 1));
      setMessage({ type: 'success', text: t('events.cancellationSuccess') });
    }

    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink-900 mb-4">Event not found</h1>
          <Link href="/events" className="text-brand-600 font-bold hover:underline">
            {t('events.backToEvents')}
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = event.status === 'cancelled';
  const isCompleted = event.status === 'completed';
  const deadlinePassed =
    event.registration_deadline && new Date(event.registration_deadline) < new Date();
  const isFull = event.capacity !== null && registrationCount >= event.capacity;
  const spotsLeft = event.capacity !== null ? event.capacity - registrationCount : null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('events.backToEvents')}
        </Link>

        <div className="bg-white rounded-3xl border border-ink-100 shadow-sm p-8 md:p-10">
          {/* Status banners */}
          {isCancelled && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
              <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">{t('events.eventCancelled')}</p>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-3 bg-ink-50 border border-ink-200 rounded-2xl p-4 mb-6">
              <CheckCircle2 className="h-5 w-5 text-ink-500 flex-shrink-0" />
              <p className="text-ink-600 font-medium">{t('events.eventCompleted')}</p>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {event.event_type && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-700">
                  {formatEventType(event.event_type)}
                </span>
              )}
              {event.format && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
                  {event.format === 'online'
                    ? t('events.online')
                    : event.format === 'hybrid'
                      ? t('events.hybrid')
                      : t('events.inPerson')}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold text-ink-900">{event.title}</h1>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {event.start_date && (
              <div className="bg-ink-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-ink-400" />
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                    {t('events.date')}
                  </p>
                </div>
                <p className="font-bold text-ink-900 text-sm">
                  {formatDateTime(event.start_date)}
                </p>
                {event.end_date && (
                  <p className="text-xs text-ink-500 mt-1">
                    to {formatDateTime(event.end_date)}
                  </p>
                )}
              </div>
            )}

            {event.location && (
              <div className="bg-ink-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-ink-400" />
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                    {t('events.location')}
                  </p>
                </div>
                <p className="font-bold text-ink-900 text-sm">{event.location}</p>
              </div>
            )}

            {event.format && (
              <div className="bg-ink-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Monitor className="h-4 w-4 text-ink-400" />
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                    {t('events.format')}
                  </p>
                </div>
                <p className="font-bold text-ink-900 text-sm">
                  {event.format === 'online'
                    ? t('events.online')
                    : event.format === 'hybrid'
                      ? t('events.hybrid')
                      : t('events.inPerson')}
                </p>
              </div>
            )}

            {event.capacity !== null && (
              <div className="bg-ink-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-ink-400" />
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                    {t('events.capacity')}
                  </p>
                </div>
                <p className="font-bold text-ink-900 text-sm">
                  {registrationCount} / {event.capacity}
                </p>
                {spotsLeft !== null && spotsLeft > 0 && !deadlinePassed && (
                  <p className="text-xs text-brand-600 font-medium mt-1">
                    {spotsLeft} {t('events.spotsLeft')}
                  </p>
                )}
              </div>
            )}

            {event.registration_deadline && (
              <div className="bg-ink-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-ink-400" />
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                    {t('events.deadline')}
                  </p>
                </div>
                <p
                  className={`font-bold text-sm ${deadlinePassed ? 'text-red-600' : 'text-ink-900'}`}
                >
                  {new Date(event.registration_deadline).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {event.event_type && (
              <div className="bg-ink-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="h-4 w-4 text-ink-400" />
                  <p className="text-xs font-bold text-ink-400 uppercase tracking-wider">
                    {t('events.type')}
                  </p>
                </div>
                <p className="font-bold text-ink-900 text-sm">
                  {formatEventType(event.event_type)}
                </p>
              </div>
            )}
          </div>

          {/* Skills focus */}
          {event.skills_focus && event.skills_focus.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-3">
                {t('events.skills')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.skills_focus.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-brand-50 text-brand-600 text-sm font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="mb-8">
              <div className="prose prose-slate max-w-none">
                <p className="text-ink-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-3 rounded-2xl p-4 mb-6 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-100 text-green-700'
                  : 'bg-red-50 border border-red-100 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <p className="font-medium text-sm">{message.text}</p>
            </div>
          )}

          {/* Registration section */}
          {!isCancelled && !isCompleted && (
            <div>
              {!userId ? (
                <Link
                  href="/login"
                  className="block w-full text-center bg-ink-900 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-ink-800 transition-all hover:scale-[1.02]"
                >
                  {t('events.signInToRegister')}
                </Link>
              ) : deadlinePassed ? (
                <div className="flex items-center justify-center gap-2 bg-ink-100 text-ink-500 px-8 py-4 rounded-2xl font-bold">
                  <Clock className="h-5 w-5" />
                  {t('events.registrationClosed')}
                </div>
              ) : isFull && !isRegistered ? (
                <div className="flex items-center justify-center gap-2 bg-ink-100 text-ink-500 px-8 py-4 rounded-2xl font-bold">
                  <Users className="h-5 w-5" />
                  {t('events.registrationClosed')}
                </div>
              ) : isRegistered ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-100 text-green-700 px-8 py-4 rounded-2xl font-bold">
                    <CheckCircle2 className="h-5 w-5" />
                    {t('events.registered')}
                  </div>
                  <button
                    onClick={handleCancelRegistration}
                    disabled={actionLoading}
                    className="block w-full text-center bg-white border border-red-200 text-red-600 px-8 py-3 rounded-2xl font-bold hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? t('events.cancelling') : t('events.cancelRegistration')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={actionLoading}
                  className="block w-full text-center bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-brand-700 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? t('events.registering') : t('events.register')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
