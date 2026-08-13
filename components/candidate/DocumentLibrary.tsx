'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/components/useConfirm';
import { FileText, Trash2, ExternalLink, Upload } from 'lucide-react';

export type DocType = 'cv' | 'certificate' | 'cover_letter' | 'motivational_letter' | 'other';

export interface CandidateDocument {
  id: string;
  name: string;
  doc_type: DocType;
  file_url: string;
  file_size_kb: number | null;
  created_at: string;
}

const DOC_LABELS: Record<DocType, string> = {
  cv: 'CV / Resume',
  certificate: 'Certificate',
  cover_letter: 'Cover Letter',
  motivational_letter: 'Motivational Letter',
  other: 'Other',
};

const DOC_COLORS: Record<DocType, string> = {
  cv: 'bg-brand-100 text-brand-700',
  certificate: 'bg-emerald-100 text-emerald-700',
  cover_letter: 'bg-amber-100 text-amber-700',
  motivational_letter: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatSize(kb: number | null) {
  if (!kb) return '';
  return kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function DocumentLibrary() {
  const [docs, setDocs] = useState<CandidateDocument[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedType, setSelectedType] = useState<DocType>('cv');
  const [customName, setCustomName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  async function loadDocs(uid?: string) {
    const supabase = createClient();
    if (!supabase) return;
    const id = uid ?? userId;
    if (!id) return;
    const { data, error } = await supabase
      .from('candidate_documents')
      .select('id, name, doc_type, file_url, file_size_kb, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    if (error) console.error('[documents] load error:', error.message);
    setDocs((data as CandidateDocument[]) ?? []);
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      if (!supabase) { setLoading(false); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      await loadDocs(user.id);
      setLoading(false);
    }
    init();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File must be under 10 MB.' });
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setUploading(true);
    setFeedback(null);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/${Date.now()}-${safeName}`;
    const docName = customName.trim() || file.name.replace(/\.[^.]+$/, '');

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, { upsert: false });

    if (uploadError) {
      setFeedback({ type: 'error', message: `Upload failed: ${uploadError.message}` });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath);

    const { error: dbError } = await supabase.from('candidate_documents').insert({
      user_id: userId,
      name: docName,
      doc_type: selectedType,
      file_url: urlData.publicUrl,
      file_size_kb: Math.ceil(file.size / 1024),
    });

    if (dbError) {
      setFeedback({ type: 'error', message: `Save failed: ${dbError.message}` });
    } else {
      setFeedback({ type: 'success', message: 'Document uploaded successfully.' });
      setCustomName('');
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
      await loadDocs();
    }
    setUploading(false);
  }

  async function handleDelete(doc: CandidateDocument) {
    if (!userId) return;
    if (!(await confirm(`Delete "${doc.name}"?`))) return;
    setDeleting(doc.id);
    const supabase = createClient();
    if (!supabase) { setDeleting(null); return; }

    const pathPart = doc.file_url.split('/documents/')[1];
    if (pathPart) {
      await supabase.storage.from('documents').remove([pathPart]);
    }

    const { error } = await supabase.from('candidate_documents').delete().eq('id', doc.id);
    if (error) {
      setFeedback({ type: 'error', message: `Delete failed: ${error.message}` });
    } else {
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    }
    setDeleting(null);
  }

  if (loading) {
    return <p className="text-sm text-slate-400 py-4">Loading documents...</p>;
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">No documents uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Upload your CV, certificates, cover letters, and more
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white transition-colors"
            >
              <div className="shrink-0 w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${DOC_COLORS[doc.doc_type]}`}
                  >
                    {DOC_LABELS[doc.doc_type]}
                  </span>
                  {doc.file_size_kb && (
                    <span className="text-xs text-slate-400">{formatSize(doc.file_size_kb)}</span>
                  )}
                  <span className="text-xs text-slate-400">· {formatDate(doc.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  title="View"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deleting === doc.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload ? (
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
          <p className="text-sm font-semibold text-slate-800">Upload a document</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DocType)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                {(Object.entries(DOC_LABELS) as [DocType, string][]).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Name <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Software Dev CV 2026"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              File, PDF, DOC or DOCX, max 10 MB
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx"
              disabled={uploading}
              onChange={handleUpload}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer disabled:opacity-50"
            />
            {uploading && <p className="text-xs text-brand-600 mt-1.5">Uploading…</p>}
          </div>

          <button
            type="button"
            onClick={() => {
              setShowUpload(false);
              setCustomName('');
              setFeedback(null);
            }}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 text-sm text-brand-600 font-medium hover:text-brand-800 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload document
        </button>
      )}
      {ConfirmDialog}
    </div>
  );
}
