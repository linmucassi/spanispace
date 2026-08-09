'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { JOBS } from '../data/constants';
import { VettedStatus, type Job } from '../types';
import { isSouthAfricanJob } from '../lib/jobLocation';
import { useTranslation } from '../lib/i18n/context';
import { WORK_KIND_CHIP, WORK_KIND_EDGE, workKind } from '../lib/work-type';

const PAGE_SIZE = 15;

interface JobBoardProps {
  initialJobs?: Job[];
}

const JobBoard: React.FC<JobBoardProps> = ({ initialJobs }) => {
  const [filter, setFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [page, setPage] = useState(1);
  const { t } = useTranslation();
  const jobs = initialJobs ?? JOBS;

  const now = new Date();

  const filteredJobs = jobs.filter((job) => {
    if (locationFilter === 'ZA' && !isSouthAfricanJob(job.location)) return false;
    if (filter === 'All') return true;
    return job.type.toLowerCase().includes(filter.toLowerCase());
  });

  // Active jobs first, expired jobs last
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aExpired = new Date(a.expiryDate) < now;
    const bExpired = new Date(b.expiryDate) < now;
    if (aExpired === bExpired) return 0;
    return aExpired ? 1 : -1;
  });

  const totalPages = Math.max(1, Math.ceil(sortedJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedJobs = sortedJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1); // reset to first page when filter changes
  };

  const handleLocationFilterChange = (value: string) => {
    setLocationFilter(value);
    setPage(1);
  };

  return (
    <div className="pt-8 pb-16 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-ink-900">{t('jobs.title')}</h2>
          <p className="text-ink-500 mt-2">{t('jobs.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={locationFilter}
            onChange={(e) => handleLocationFilterChange(e.target.value)}
            className="bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">{t('jobs.allLocations')}</option>
            <option value="ZA">{t('jobs.southAfricaOnly')}</option>
          </select>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">{t('jobs.allTypes')}</option>
            <option value="Full-time">{t('jobs.fullTime')}</option>
            <option value="Part-time">{t('jobs.partTime')}</option>
            <option value="Piece Job">{t('jobs.pieceJob')}</option>
            <option value="Temporary">{t('jobs.temporary')}</option>
            <option value="Contract">{t('jobs.contract')}</option>
            <option value="Remote">{t('jobs.remote')}</option>
            <option value="Hybrid">{t('jobs.hybrid')}</option>
            <option value="On-site">{t('jobs.onSite')}</option>
            <option value="Learnership">{t('jobs.learnership')}</option>
          </select>
        </div>
      </div>

      {/* A feed of cards, at every width.
          This was a <table> in an overflow-x-auto, so on a phone you scrolled
          sideways to reach View Details and the Spanispace Verified badge, the
          one signal that says this is not a scam, was cut off by the screen
          edge. A table is for comparing columns on a wide screen. This audience
          is on a phone, scanning, deciding on pay and place. So: cards, ordered
          the way the decision is actually made. */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pagedJobs.map((job) => {
          const isExpired = new Date(job.expiryDate) < now;
          const kind = workKind(job.type);
          const verified = job.vettedStatus === VettedStatus.VERIFIED;

          return (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className={`group flex h-full flex-col rounded-xl border border-l-4 border-ink-200 bg-white p-5 transition-colors hover:border-ink-300 ${
                  WORK_KIND_EDGE[kind]
                } ${isExpired ? 'opacity-55' : ''}`}
              >
                {/* Trust first, and it can no longer be clipped. */}
                <div className="mb-4 flex items-center justify-between gap-2">
                  {isExpired ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                      {t('jobs.expired')}
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider ${
                        verified ? 'text-emerald-700' : 'text-brand-700'
                      }`}
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden>
                        <path d="M8 0 9.9 1.4 12.2 1 13 3.2l2 1.2-.7 2.3.7 2.3-2 1.2-.8 2.2-2.3-.4L8 14l-1.9-1.4-2.3.4-.8-2.2-2-1.2.7-2.3L1 4.4l2-1.2.8-2.2 2.3.4z" />
                        <path d="m6.9 10.4-2.4-2.4 1-1 1.4 1.4 3.3-3.3 1 1z" className="fill-white" />
                      </svg>
                      {verified ? t('jobs.verified') : job.vettedStatus}
                    </span>
                  )}
                  {job.duration && (
                    <span className="shrink-0 text-[11px] text-ink-400">{job.duration}</span>
                  )}
                </div>

                <h3 className="font-display text-lg font-bold leading-snug text-ink-900 group-hover:text-brand-600">
                  {job.role}
                </h3>
                <p className="mt-1 text-sm text-ink-500">{job.company}</p>

                <div className="mt-auto pt-5">
                  <p className="flex items-start gap-1.5 text-sm text-ink-600">
                    <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-ink-300" aria-hidden>
                      <path d="M8 0a5 5 0 0 0-5 5c0 3.7 5 11 5 11s5-7.3 5-11a5 5 0 0 0-5-5m0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4" />
                    </svg>
                    {job.location}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    {/* Pay only appears when the listing actually published one. */}
                    {job.payRange ? (
                      <span className="font-display text-base font-bold text-ink-900">
                        {job.payRange}
                      </span>
                    ) : (
                      // Say nothing rather than "Pay not listed" on every card.
                      // Repeated down a column it reads as a wall of no.
                      <span />
                    )}
                    <span
                      className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${WORK_KIND_CHIP[kind]}`}
                    >
                      {job.type}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {pagedJobs.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-200 py-16 text-center text-ink-400">
          {t('jobs.noJobs')}
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-1">
          <p className="text-sm text-ink-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, sortedJobs.length)} of {sortedJobs.length} jobs
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-ink-200 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-ink-500">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-ink-200 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobBoard;
