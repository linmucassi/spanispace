'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DbUniversityInterest } from '@/types/database';

// Read-only: unlike jobs/learnerships there's no status pipeline here, just
// visibility into who clicked through to which institution. Fully separate
// from the jobs/applications system by design -- see
// supabase/add-application-journeys.sql.
export default function AdminUniversityApplications() {
  const [items, setItems] = useState<DbUniversityInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from('university_application_interests')
        .select('*, late_uni_app:late_uni_apps(institution)')
        .order('created_at', { ascending: false })
        .limit(200);
      setItems((data as DbUniversityInterest[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">University Interest</h1>
        <p className="text-slate-500 text-sm">Candidates who started a university/college application before being sent to the institution&apos;s site</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No interest captured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Institution</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.late_uni_app?.institution ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.email || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {new Date(item.created_at).toLocaleDateString('en-ZA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
