'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { JOBS } from '../data/constants';
import { VettedStatus } from '../types';
import { useTranslation } from '../lib/i18n/context';

const JobBoard: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const { t } = useTranslation();

  const now = new Date();

  const filteredJobs = JOBS.filter((job) => {
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

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">{t('jobs.title')}</h2>
          <p className="text-slate-500 mt-2">{t('jobs.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">{t('jobs.allTypes')}</option>
            <option value="Remote">{t('jobs.remote')}</option>
            <option value="Hybrid">{t('jobs.hybrid')}</option>
            <option value="On-site">{t('jobs.onSite')}</option>
            <option value="Learnership">{t('jobs.learnership')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('jobs.roleTitle')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('jobs.company')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  {t('jobs.location')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  {t('jobs.expiry')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('jobs.status')}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('jobs.action')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedJobs.map((job) => {
                const isExpired = new Date(job.expiryDate) < now;
                return (
                  <tr
                    key={job.id}
                    className={`transition-colors ${isExpired ? 'opacity-50' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-6 py-5">
                      <Link href={`/jobs/${job.id}`} className="block">
                        <span className="block text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                          {job.role}
                        </span>
                        <span className="text-xs text-indigo-500 font-medium">{job.type}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">{job.company}</td>
                    <td className="px-6 py-5 text-sm text-slate-600 hidden md:table-cell">
                      {job.location}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600 font-mono hidden md:table-cell">
                      {job.expiryDate}
                    </td>
                    <td className="px-6 py-5">
                      {isExpired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <svg className="mr-1.5 h-2 w-2 text-current fill-current" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          {t('jobs.expired')}
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            job.vettedStatus === VettedStatus.VERIFIED
                              ? 'bg-green-100 text-green-700'
                              : job.vettedStatus === VettedStatus.SKILLS_ASSESSED
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          <svg className="mr-1.5 h-2 w-2 text-current fill-current" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="3" />
                          </svg>
                          {job.vettedStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      {isExpired ? (
                        <span className="text-slate-400 text-sm">{t('jobs.expired')}</span>
                      ) : (
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-indigo-600 hover:text-indigo-700 font-bold text-sm"
                        >
                          {t('jobs.viewDetails')} &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sortedJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    {t('jobs.noJobs')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
