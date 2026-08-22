'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import type { PublicJobDetail } from '@/lib/publicJobs';
import { logJobEvent } from '@/lib/jobAnalytics';
import { fetchMyApplicationForJob, formatAppliedDate } from '@/lib/applications';

export default function JobDetailView({ job }: { job: PublicJobDetail }) {
  const { t } = useTranslation();
  const isExpired = new Date(job.expiryDate) < new Date();
  const [appliedAt, setAppliedAt] = useState<string | null>(null);

  useEffect(() => {
    // Only real, company-owned listings can be tracked (static fallback
    // jobs have no matching row in the `jobs` table).
    if (job.source === 'db') {
      logJobEvent('job_views', job.id);
    }
  }, [job.id, job.source]);

  useEffect(() => {
    // Static fallback jobs are never written to `applications`, so there is
    // nothing to look up for them.
    if (job.source !== 'db') return;
    let active = true;
    fetchMyApplicationForJob(job.id).then((result) => {
      if (active) setAppliedAt(result.appliedAt);
    });
    return () => {
      active = false;
    };
  }, [job.id, job.source]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-brand-600 font-medium hover:underline mb-8"
        >
          {t('jobDetail.backToJobs')}
        </Link>

        <div className="bg-white rounded-3xl border border-ink-100 shadow-sm p-8 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-ink-900 mb-3">
              {job.role}
            </h1>
            <div className="flex flex-wrap gap-3 items-center text-sm text-ink-500">
              <span className="font-semibold text-ink-700">{job.company}</span>
              <span className="w-1 h-1 rounded-full bg-ink-300" />
              <span>{job.location}</span>
              <span className="w-1 h-1 rounded-full bg-ink-300" />
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  job.type.includes('Remote')
                    ? 'bg-emerald-100 text-emerald-700'
                    : job.type.includes('Hybrid')
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                }`}
              >
                {job.type}
              </span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-ink-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">
                {t('jobDetail.postedBy')}
              </p>
              <p className="font-bold text-ink-900">{job.company}</p>
            </div>
            <div className="bg-ink-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">
                {t('jobDetail.jobType')}
              </p>
              <p className="font-bold text-ink-900">
                {job.type}
                {job.duration ? ` · ${job.duration}` : ''}
              </p>
            </div>
            <div className="bg-ink-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-ink-400 uppercase tracking-wider mb-1">
                {t('jobDetail.expiresOn')}
              </p>
              <p
                className={`font-bold ${
                  isExpired ? 'text-red-600' : 'text-ink-900'
                }`}
              >
                {job.expiryDate}
              </p>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-2">
                Role Description
              </h2>
              <div className="text-ink-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-2">
                Requirements
              </h2>
              <div className="text-ink-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Salary */}
          {job.salaryRange && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-ink-400 uppercase tracking-wider mb-2">
                Salary
              </h2>
              <p className="text-ink-700">{job.salaryRange}</p>
            </div>
          )}

          {/* Status */}
          <div className="mb-8">
            {isExpired ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 font-medium">
                {t('jobDetail.expired')}
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                <svg
                  className="mr-1.5 h-2 w-2 fill-current"
                  viewBox="0 0 8 8"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
                {job.vettedStatus}
              </div>
            )}
          </div>

          {/* Apply button, or a reminder that this one is already in */}
          {appliedAt ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-100 text-green-700 px-8 py-4 rounded-2xl font-bold">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                {t('jobDetail.alreadyApplied')}
              </div>
              <p className="text-center text-sm text-ink-500">
                {t('jobDetail.appliedOn')} {formatAppliedDate(appliedAt)}
              </p>
              <Link
                href="/candidate/applications"
                className="block text-center text-sm text-brand-600 font-medium hover:underline"
              >
                {t('jobDetail.viewMyApplications')}
              </Link>
            </div>
          ) : (
            !isExpired && (
              <div>
                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="block w-full text-center bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-brand-700 transition-all hover:scale-[1.02]"
                >
                  {t('jobDetail.applyForPosition')}
                </Link>
                {job.applyMode === 'redirect' && (
                  <p className="text-center text-xs text-ink-500 mt-2">
                    You&apos;ll finish this application on {job.company}&apos;s site.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
