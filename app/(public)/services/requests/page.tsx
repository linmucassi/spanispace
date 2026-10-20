import { redirect } from 'next/navigation';

// Moved into the candidate portal (so the sidebar stays), 20 Oct 2026.
export default function OldServiceRequestsPage() {
  redirect('/candidate/services/hire');
}
