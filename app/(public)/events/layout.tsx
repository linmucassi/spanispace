import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events, Workshops & Webinars',
  description:
    'Workshops, webinars, hackathons, and career events to boost your career on Spanispace.',
  alternates: { canonical: '/events' },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
