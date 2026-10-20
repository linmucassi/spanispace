import { redirect } from 'next/navigation';

// Moved into the candidate portal (so the sidebar stays), 20 Oct 2026.
export default async function OldServiceChatPage({ params }: { params: Promise<{ id: string; threadId: string }> }) {
  const { threadId } = await params;
  redirect(`/candidate/services/chat/${encodeURIComponent(threadId)}`);
}
