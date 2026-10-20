'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useConfirm } from '@/components/useConfirm';
import { scanText, explainContactScan } from '@/lib/services/contactGuard';
import { Loader2, Lock, Send } from 'lucide-react';

export type ChatMessage = {
  id: string;
  sender_id: string | null;
  kind: 'text' | 'system' | 'offer';
  body: string;
  created_at: string;
};

type ThreadStatus = 'open' | 'declined' | 'closed' | 'booked';

const POLL_MS = 5000;

function time(iso: string) {
  return new Date(iso).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// Reads come straight from Supabase (RLS lets both parties read the thread).
// Sends go through /api/services/messages, which runs the contact guard
// server-side. The warning shown here while typing is only a courtesy.
export default function ServiceChat({
  threadId,
  currentUserId,
  role,
  otherName,
  initialMessages,
  initialStatus,
  contactUnlocked,
}: {
  threadId: string;
  currentUserId: string;
  role: 'requester' | 'provider';
  otherName: string;
  initialMessages: ChatMessage[];
  initialStatus: ThreadStatus;
  contactUnlocked: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ThreadStatus>(initialStatus);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const lastSeen = useRef(initialMessages.at(-1)?.created_at ?? '1970-01-01T00:00:00Z');

  const markRead = useCallback(() => {
    void fetch(`/api/services/threads/${threadId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read' }),
    }).catch(() => {});
  }, [threadId]);

  useEffect(() => {
    markRead();
    const supabase = createClient();
    if (!supabase) return;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      const [{ data: fresh }, { data: thread }] = await Promise.all([
        supabase
          .from('service_messages')
          .select('id, sender_id, kind, body, created_at')
          .eq('thread_id', threadId)
          .gt('created_at', lastSeen.current)
          .order('created_at'),
        supabase.from('service_threads').select('status').eq('id', threadId).maybeSingle(),
      ]);
      if (thread?.status) setStatus(thread.status as ThreadStatus);
      if (fresh && fresh.length > 0) {
        lastSeen.current = fresh[fresh.length - 1].created_at;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          return [...prev, ...(fresh as ChatMessage[]).filter((m) => !known.has(m.id))];
        });
        markRead();
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [threadId, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/services/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not send your message.');
        return;
      }
      setDraft('');
      lastSeen.current = data.message.created_at;
      setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]));
    } catch {
      setError('Could not reach Spanispace. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  async function act(action: 'decline' | 'close') {
    const label = action === 'decline' ? 'decline this request' : 'close this conversation';
    if (!(await confirm(`Are you sure you want to ${label}?`))) return;
    setActing(true);
    const res = await fetch(`/api/services/threads/${threadId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setActing(false);
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
    setStatus(action === 'decline' ? 'declined' : 'closed');
  }

  const live = scanText(draft);
  const isOpen = status === 'open' || status === 'booked';

  return (
    <div className="flex flex-col rounded-2xl border border-ink-100 bg-white">
      {ConfirmDialog}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <p className="font-semibold text-ink-900">{otherName}</p>
        {isOpen && (
          <div className="flex gap-3 text-xs font-medium">
            {role === 'provider' && status === 'open' && (
              <button type="button" onClick={() => act('decline')} disabled={acting} className="text-ink-500 hover:text-red-600">Decline request</button>
            )}
            {status === 'open' && (
              <button type="button" onClick={() => act('close')} disabled={acting} className="text-ink-500 hover:text-red-600">Close conversation</button>
            )}
          </div>
        )}
      </div>

      {!contactUnlocked && (
        <p className="flex items-start gap-2 bg-ink-50 px-4 py-2 text-xs text-ink-600">
          <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
          Phone numbers, emails and links are blocked until a booking is confirmed and paid. This protects both of you.
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 max-h-[60vh] min-h-[16rem]" aria-live="polite">
        {messages.map((m) => {
          if (m.kind === 'system') {
            return <p key={m.id} className="text-center text-xs text-ink-500 px-6">{m.body}</p>;
          }
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-ink-100 text-ink-900 rounded-bl-sm'}`}>
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-brand-100' : 'text-ink-400'}`}>{time(m.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isOpen ? (
        <form onSubmit={send} className="border-t border-ink-100 p-3 space-y-2">
          {live.blocked && <p className="text-xs text-amber-700">{explainContactScan(live.reasons)}</p>}
          {error && <p className="text-xs text-red-700">{error}</p>}
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); }
              }}
              rows={2}
              maxLength={2000}
              placeholder={`Message ${otherName}`}
              aria-label="Message"
              className="flex-1 resize-none rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
            <button type="submit" disabled={sending || !draft.trim()} className="self-end rounded-xl bg-brand-600 px-4 py-2.5 text-white hover:bg-brand-700 disabled:opacity-40" aria-label="Send message">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      ) : (
        <p className="border-t border-ink-100 px-4 py-3 text-sm text-ink-500">This conversation is closed.</p>
      )}
    </div>
  );
}
