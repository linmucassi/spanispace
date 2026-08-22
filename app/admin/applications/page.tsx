'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DbApplication } from '@/types/database';

export default function AdminApplications() {
  const [apps, setApps] = useState<DbApplication[]>([]);
  const [filter, setFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadApps = async () => {
    const supabase = createClient();
    if (!supabase) { setLoading(false); return; }

    let query = supabase.from('applications').select('*, job:jobs(title, location, job_type, origin, apply_mode)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);

    const { data } = await query;
    setApps((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { loadApps(); }, [filter]);

  const visibleApps = originFilter === 'all'
    ? apps
    : apps.filter((app) => (app as any).job?.origin === originFilter);

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.from('applications').update({ status }).eq('id', id);
    loadApps();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Applications</h1>
        <p className="text-slate-500 text-sm">Review and manage job applications</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {['all', 'pending', 'reviewed', 'shortlisted', 'rejected', 'hired'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
          className="ml-auto px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600"
        >
          <option value="all">All sources</option>
          <option value="company">Company-posted</option>
          <option value="admin_curated">Admin-curated</option>
          <option value="scraped">Scraped</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : visibleApps.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No applications found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleApps.map((app) => (
              <div key={app.id} className="hover:bg-slate-50/50 transition-colors">
                <div className="px-6 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === app.id ? null : app.id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{app.full_name}</p>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                      {(app as any).job?.title ?? 'Unknown job'} &middot; {app.phone}
                      {(app as any).job?.job_type === 'Learnership' && (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700">Learnership</span>
                      )}
                      {(app as any).job?.origin === 'scraped' && (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">Scraped</span>
                      )}
                      {(app as any).job?.apply_mode === 'redirect' && (
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">Redirected</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                      app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                      app.status === 'hired' ? 'bg-brand-100 text-brand-700' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{app.status}</span>
                    <span className="text-xs text-slate-400 font-mono">{new Date(app.created_at).toLocaleDateString('en-ZA')}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded === app.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {expanded === app.id && (
                  <div className="px-6 pb-4 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div><span className="text-xs font-bold text-slate-400 uppercase">Phone</span><p className="text-slate-900">{app.phone}</p></div>
                      <div><span className="text-xs font-bold text-slate-400 uppercase">WhatsApp</span><p className="text-slate-900">{app.whatsapp || '-'}</p></div>
                      <div><span className="text-xs font-bold text-slate-400 uppercase">Email</span><p className="text-slate-900">{app.email || '-'}</p></div>
                      <div><span className="text-xs font-bold text-slate-400 uppercase">Location</span><p className="text-slate-900">{app.location || '-'}</p></div>
                    </div>
                    {app.about_you && (
                      <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">About</span>
                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{app.about_you}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {app.status === 'pending' && (
                        <button onClick={() => updateStatus(app.id, 'reviewed')} className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">Mark Reviewed</button>
                      )}
                      <button onClick={() => updateStatus(app.id, 'shortlisted')} className="px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 rounded-lg hover:bg-green-100">Shortlist</button>
                      <button onClick={() => updateStatus(app.id, 'hired')} className="px-3 py-1.5 text-xs font-bold bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100">Mark Hired</button>
                      <button onClick={() => updateStatus(app.id, 'rejected')} className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Reject</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
