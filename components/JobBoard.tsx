
import React from 'react';
import { JOBS } from '../constants';
import { VettedStatus } from '../types';

const JobBoard: React.FC = () => {
  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Vetted Job Opportunities</h2>
          <p className="text-slate-500 mt-2">Every role listed here is verified for security and trust.</p>
        </div>
        <div className="flex space-x-2">
          <select className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option>All Types</option>
            <option>Remote</option>
            <option>Hybrid</option>
            <option>On-site</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role / Title</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {JOBS.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <span className="block text-sm font-bold text-slate-900">{job.role}</span>
                    <span className="text-xs text-indigo-500 font-medium">{job.type}</span>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">{job.company}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">{job.location}</td>
                  <td className="px-6 py-5 text-sm text-slate-600 font-mono">{job.expiryDate}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      job.vettedStatus === VettedStatus.VERIFIED ? 'bg-green-100 text-green-700' :
                      job.vettedStatus === VettedStatus.SKILLS_ASSESSED ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      <svg className="mr-1.5 h-2 w-2 text-current fill-current" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                      {job.vettedStatus}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <a href={job.applyLink} className="text-indigo-600 hover:text-indigo-700 font-bold text-sm">Apply Now →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
