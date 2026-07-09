'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { DbMessage } from '@/types/database';
import { Send } from 'lucide-react';

export type ThreadSummary = {
  id: string;
  otherPartyName: string;
  jobTitle: string | null;
  lastMessageAt: string;
  lastMessageBody: string | null;
  unreadCount: number;
};

export default function MessagesInbox({
  currentUserId,
  threads,
  initialSelectedThreadId,
}: {
  currentUserId: string;
  threads: ThreadSummary[];
  initialSelectedThreadId?: string | null;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedThreadId ?? threads[0]?.id ?? null
  );
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMessages() {
      if (!selectedId) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      const supabase = createClient();
      if (!supabase) {
        setLoadingMessages(false);
        return;
      }

      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', selectedId)
        .order('created_at', { ascending: true });

      setMessages((data as DbMessage[]) ?? []);
      setLoadingMessages(false);

      // Mark the other party's messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('thread_id', selectedId)
        .neq('sender_id', currentUserId)
        .is('read_at', null);
    }

    loadMessages();
  }, [selectedId, currentUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !body.trim()) return;

    setError('');
    setSending(true);
    const supabase = createClient();
    if (!supabase) {
      setSending(false);
      setError('Unable to connect to database.');
      return;
    }

    const { data, error: dbError } = await supabase
      .from('messages')
      .insert({ thread_id: selectedId, sender_id: currentUserId, body: body.trim() })
      .select('*')
      .single();

    if (dbError) {
      setSending(false);
      setError(dbError.message);
      return;
    }

    await supabase
      .from('message_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', selectedId);

    setMessages((prev) => [...prev, data as DbMessage]);
    setBody('');
    setSending(false);
    router.refresh();
  };

  if (threads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-16 text-center">
        <p className="text-slate-500">No conversations yet.</p>
      </div>
    );
  }

  const selectedThread = threads.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex h-[calc(100vh-220px)] min-h-[420px]">
      {/* Thread list */}
      <div className="w-72 shrink-0 border-r border-slate-100 overflow-y-auto">
        {threads.map((thread) => (
          <button
            key={thread.id}
            onClick={() => setSelectedId(thread.id)}
            className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors ${
              selectedId === thread.id ? 'bg-indigo-50' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900 truncate">
                {thread.otherPartyName}
              </p>
              {thread.unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {thread.unreadCount}
                </span>
              )}
            </div>
            {thread.jobTitle && (
              <p className="text-xs text-indigo-500 truncate mt-0.5">{thread.jobTitle}</p>
            )}
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {thread.lastMessageBody || 'No messages yet'}
            </p>
          </button>
        ))}
      </div>

      {/* Selected thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedThread ? (
          <>
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="font-bold text-slate-900">{selectedThread.otherPartyName}</p>
              {selectedThread.jobTitle && (
                <p className="text-xs text-slate-500">Re: {selectedThread.jobTitle}</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center mt-8">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                        }`}
                      >
                        {msg.body}
                        <div
                          className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}
                        >
                          {new Date(msg.created_at).toLocaleString('en-ZA', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-100 p-4 flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={sending || !body.trim()}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            {error && <p className="text-xs text-red-600 px-4 pb-3">{error}</p>}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
