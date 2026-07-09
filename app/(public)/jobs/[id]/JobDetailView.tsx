'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/context';
import type { PublicJobDetail } from '@/lib/publicJobs';
import { logJobEvent } from '@/lib/jobAnalytics';

export default function JobDetailView({ job }: { job: PublicJobDetail }) {
  const { t } = useTranslation();
  const isExpired = new Date(job.expiryDate) < new Date();

  useEffect(() => {
    // Only real, company-owned listings can be tracked (static fallback
    // jobs have no matching row in the `jobs` table).
    if (job.source === 'db') {
      logJobEvent('job_views', job.id);
    }
  }, [job.id, job.source]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-indigo-600 font-medium hover:underline mb-8"
        >
          {t('jobDetail.backToJobs')}
        </Link>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
              {job.role}
            </h1>
            <div className="flex flex-wrap gap-3 items-center text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{job.company}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{job.location}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
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
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t('jobDetail.postedBy')}
              </p>
              <p className="font-bold text-slate-900">{job.company}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t('jobDetail.jobType')}
              </p>
              <p className="font-bold text-slate-900">{job.type}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t('jobDetail.expiresOn')}
              </p>
              <p
                className={`font-bold ${
                  isExpired ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                {job.expiryDate}
              </p>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                Role Description
              </h2>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                Requirements
              </h2>
              <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Salary */}
          {job.salaryRange && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                Salary
              </h2>
              <p className="text-slate-700">{job.salaryRange}</p>
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

          {/* Apply button */}
          {!isExpired && (
            <Link
              href={`/jobs/${job.id}/apply`}
              className="block w-full text-center bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all hover:scale-[1.02]"
            >
              {t('jobDetail.applyForPosition')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
