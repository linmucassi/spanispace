'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare } from 'lucide-react';

interface Application {
  id: string;
  job_id: string;
  candidate_id: string | null;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  about_you: string | null;
  cover_letter: string | null;
  cv_url: string | null;
  documents: { name: string; doc_type: string; file_url: string }[] | null;
  status: string;
  created_at: string;
  job?: { title: string };
}

const DOC_LABELS: Record<string, string> = {
  cv: 'CV / Resume',
  certificate: 'Certificate',
  cover_letter: 'Cover Letter',
  motivational_letter: 'Motivational Letter',
  other: 'Other',
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    reviewed: 'bg-blue-100 text-blue-700',
    shortlisted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    hired: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
        styles[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

export default function ApplicationList({
  initialApplications,
}: {
  initialApplications: Application[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const filters = ['all', 'pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

  const filteredApps =
    filter === 'all'
      ? initialApplications
      : initialApplications.filter((app) => app.status === filter);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    const supabase = createClient();
    if (!supabase) {
      setUpdating(null);
      return;
    }

    const { error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', id);

    setUpdating(null);

    if (!error) {
      router.refresh();
    }
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            No applications found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredApps.map((app) => (
              <div key={app.id} className="hover:bg-slate-50/50 transition-colors">
                {/* Row Summary */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpanded(expanded === app.id ? null : app.id)
                  }
                >
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-4 items-center">
                    <div className="md:col-span-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {app.full_name}
                      </p>
                    </div>
                    <div className="md:col-span-1">
                      <p className="text-xs text-slate-500 truncate">
                        {app.job?.title ?? 'Unknown job'}
                      </p>
                    </div>
                    <div className="md:col-span-1">
                      <p className="text-xs text-slate-500 truncate">
                        {app.phone}
                      </p>
                    </div>
                    <div className="md:col-span-1">
                      <p className="text-xs text-slate-500 truncate">
                        {app.email || '-'}
                      </p>
                    </div>
                    <div className="md:col-span-1">
                      <p className="text-xs text-slate-500 truncate">
                        {app.location || '-'}
                      </p>
                    </div>
                    <div className="md:col-span-1 flex items-center gap-2">
                      <StatusBadge status={app.status} />
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(app.created_at).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                  </div>

                  <svg
                    className={`w-4 h-4 text-slate-400 ml-4 shrink-0 transition-transform ${
                      expanded === app.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Expanded Details */}
                {expanded === app.id && (
                  <div className="px-6 pb-5 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Phone
                        </span>
                        <p className="text-slate-900">{app.phone}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          WhatsApp
                        </span>
                        <p className="text-slate-900">{app.whatsapp || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Email
                        </span>
                        <p className="text-slate-900">{app.email || '-'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Location
                        </span>
                        <p className="text-slate-900">{app.location || '-'}</p>
                      </div>
                    </div>

                    {app.about_you && (
                      <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          About
                        </span>
                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                          {app.about_you}
                        </p>
                      </div>
                    )}

                    {app.cover_letter && (
                      <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Cover Letter
                        </span>
                        <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                          {app.cover_letter}
                        </p>
                      </div>
                    )}

                    {app.documents && app.documents.length > 0 ? (
                      <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Documents
                        </span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {app.documents.map((doc, i) => (
                            <a
                              key={i}
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              {DOC_LABELS[doc.doc_type] ?? doc.doc_type}: {doc.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      app.cv_url && (
                        <div className="mb-4">
                          <span className="text-xs font-bold text-slate-400 uppercase">
                            CV
                          </span>
                          <p className="mt-1">
                            <a
                              href={app.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 font-medium hover:underline"
                            >
                              View / Download CV
                            </a>
                          </p>
                        </div>
                      )
                    )}

                    {/* Status Actions */}
                    <div className="flex gap-2 pt-2 flex-wrap">
                      {app.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(app.id, 'reviewed')}
                          disabled={updating === app.id}
                          className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                          Mark Reviewed
                        </button>
                      )}
                      {app.status !== 'shortlisted' && app.status !== 'hired' && (
                        <button
                          onClick={() => updateStatus(app.id, 'shortlisted')}
                          disabled={updating === app.id}
                          className="px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          Shortlist
                        </button>
                      )}
                      {app.status !== 'hired' && (
                        <button
                          onClick={() => updateStatus(app.id, 'hired')}
                          disabled={updating === app.id}
                          className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                          Mark Hired
                        </button>
                      )}
                      {app.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(app.id, 'rejected')}
                          disabled={updating === app.id}
                          className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      {app.candidate_id && (
                        <Link
                          href={`/company/messages?candidateId=${app.candidate_id}&jobId=${app.job_id}`}
                          className="px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Message
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
