import { redirect } from 'next/navigation';

// Moved into the candidate portal (so the sidebar stays), 20 Oct 2026.
export default async function OldServiceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/candidate/services/hire/${encodeURIComponent(id)}`);
}
